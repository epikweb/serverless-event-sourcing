# Serverless Event Sourcing


# Abstract

When building complex distributed web applications, we often run into 2 challenges, **operational middleware complexity** and **decomposition**.
This document intends to be a stab at a simpler approach to building and deploying distributed web applications, using a blend of different battle-tested solutions in the industry.



## Operational Middleware Complexity

![](https://platform9.com/wp-content/uploads/2019/05/kubernetes-constructs-concepts-architecture.jpg)

To run a typical distributed web application, a typical devops stack will likely require knowledge of:

- Docker
- Docker compose
- Kubernetes
- Service discovery/service meshes
- Etcd
- Load balancers
- Backpressure
- Circuit breakers
- Kafka
- Zookeeper
- Secret management
- High availability/availability zones
- Failover
- Change data capture
- ETL data pipelines
- Linux shell scripts


This results in a middleware stack that is highly complex, and requires extensive documentation for a newly onboarded developers to understand. 




# Decomposition

## Attempt #1 - Monolith

What we think happened:

![](https://i.gyazo.com/a1fca91d8290e3ed53149878ddf57d2b.png)

What really happened:



## Attempt #2 - DDD Aggregate



## Attempt #3 - Decompose preconditions by business use case



## Storage normalization downsides
![](https://www.interfacett.com/wp-content/uploads/2014/08/001-Multiple-Joins-Work-just-like-Single-Joins.png)

- Query complexity
- Slow OLAP queries

Add another 20 joins, a few group bys and we end up in a situation where data access to answer queries has more complexity than the business logic and requires integration tests to cover each branch of complexity.
As Greg Young talks about, this complexity is largely accidental, and comes from trying to fit a model that is event-based into a relational schema.

Wouldn't it be nice to selectively apply the **Event Sourcing** pattern with CQRS to be able to have more control over where this complexity resides for the complex core subdomains in our system?



# Solution

# The Blueprint: Event Modeling
![](https://eventmodeling.org/posts/what-is-event-modeling/blueprint.jpg)

Event modeling allows for a simple visualization how each component of the system talks to one another.

# The Implementation: Event Sourcing
![](https://www.continuousimprover.com/assets/images/posts/2020-06-21-why-event-sourcing.jpg)

**Event Sourcing** is an incredibly powerful pattern, offering benefits such as:

- Immutable audit log of all business state changes
- Fast scalable writes
- Freedom from any sort of mapping when persisting aggregates
- Lack of relational table explosion to persist a complex business aggregate into a source of truth + queryable state
- Less cyclomatic complexity in data access logic that is hard to test due to the fact that read models are decoupled from the write model all the way down to persistence

... but has a large number of tradeoffs such as:

- Versioning of long-lived aggregates
- Versioning of event schemas
- Refactoring aggregate boundaries is difficult to correct once a system is in production
- Tight coupling of snapshots to the underlying left-fold that created the state
- Read model replay ordering guarantees
- Read model replay time with a large number of events


Most of these issues can be mitigated can be distilled to the fact that schema changes are not atomic like a relational database. Instead, event schema changes happen while two versions of the domain model event schema are live unless the system is fully taken offline & restarted.

## Solving the tradeoffs

### Refactoring - Upcasting
- Add default values to older events as new information is available (akin to add column with default value in a relational database)


### Refactoring Deluxe - Copy Transform with Blue Green Deployment
![](https://res.cloudinary.com/practicaldev/image/fetch/s--HW_8_gYS--/c_imagga_scale,f_auto,fl_progressive,h_500,q_auto,w_1000/https://thepracticaldev.s3.amazonaws.com/i/m664yyotixnqncprryf0.png)

- Allows for complete refactoring of historical events (copy-replace)
- Need to ensure external subscribers such as emailers do not resend emails


### Tombstoning/Archiving
- Allows for shorter streams of traditionally long-lived aggregate by using a special event to carry-forward state into a new stream.
- Allows for a small OLTP data footprint since events before the reconciliation checkpoint can be archived. This speeds up replay time considerably.

#### Examples
- Opening balance when your bank carries forward your credit card balance
- Closing the books at the end of an accounting year-end and bringing forward the closing balances of the general ledger


### Upfront design
- Event Sourcing requires upfront design with domain experts to discover the stream boundaries.
- By applying the event modeling approach, boundaries can be found early to prevent having versioning issues/needing to refactor
- Copy transform with blue-green deployments is used as an escape hatch to refactor incorrect boundaries


### Query Federation
- Archived aggregate data is now hard to query
- We need a way to replay an aggregates state across archived + online data
- S3 for aggregate archiving, athena to query?


# The Infrastructure: Serverless & Ephemeral

## Ephemeral
- Allows simpler refactoring of wrong aggregate boundaries with a live production system by copying online events to a new data store and replaying them into new projections
- Prevents the need to make events forwards compatible with blue-green deployments
- Greg Young says we should replay/cutover every deployment to prove its possible, although we can make it optional in this setup
- The ultimate smoke test: your green application state matches blue after replaying all historical events

## Scalability
- DDD aggregates and partitioning allow for pay as you go scalability, without worrying about things such as CPU/memory usage


## Event Store - DynamoDB
- Allows for an in-order replay guarantee on a per-stream basis.
- Allows for write scalability due to sharding based on a UUID key with high cardinality (`aggregateId`).
- Has transactional guarantees necessary to prevent concurrent writers writing to the same `expectedVersion`
- Has built-in streaming to Kinesis with the flip of a switch

### Primary key schema

| Hash Key        | Range Key
| ------------- |:-------------:|
| `aggregateId`      | `version`

## Http Rest API - API Gateway
- Mutable big flip switch for blue green deployments

## Websockets - API Gateway
- Mutable big flip switch for blue green deployments

## Command Handlers - Lambda
![](https://theburningmonk.com/wp-content/uploads/2019/08/img_5d5fe26a0551d.png)

- One lambda per command


## Event Bus - Kinesis

![](https://d2908q01vomqb2.cloudfront.net/1b6453892473a467d07372d45eb05abc2031647a/2020/09/28/kinesis1-1024x309.png)
![](https://d2908q01vomqb2.cloudfront.net/1b6453892473a467d07372d45eb05abc2031647a/2020/09/28/kinesis2-1024x370.png)

- Kinesis has ordering guarantees per dynamodb partition
- This allowed in-order replay of aggregates even with competing consumers


## Projectors - Lambda
![](https://theburningmonk.com/wp-content/uploads/2019/08/img_5d5fe26a0551d.png)

- One lambda per read model with competing consumers


## Read Model Store #1 - DynamoDB
- Stores read models that can be fit within a single document (under 400kb)


## Read Model Store #2 - ElasticSearch
- Stores read models that cannot be fit within a single document and require a balanced search tree or full text search for indexing


# References
- Greg Young - [Versioning in an Event Sourced System](https://leanpub.com/esversioning/read)
- Greg Young - [A Decade of DDD, CQRS, Event Sourcing](https://www.youtube.com/watch?v=LDW0QWie21s)
- Adam Dymitruk - [Event Modeling Organization](https://eventmodeling.org/)
- Adam Dymitruk - [Event Modeling Talk](https://www.youtube.com/watch?v=UYJ83me8O58)
- Vaughn Vernon - [oDDs and enDDs](https://www.youtube.com/watch?v=4UZZjyQDgT8)
- Vaughn Vernon - [Rethinking Legacy and Monolithic Systems](https://www.youtube.com/watch?v=OSARwCnSRCI)
- Jimmy Bogard - [Vertical Slice Architecture Talk](https://www.youtube.com/watch?v=5kOzZz2vj2o)
- Jimmy Bogard - [Vertical Slice Architecture Blog](https://jimmybogard.com/vertical-slice-architecture/)
- Vladimir Khorikov - [When to Mock](https://enterprisecraftsmanship.com/posts/when-to-mock/)
- Vladimir Khorikov - [Immutable Architecture](https://enterprisecraftsmanship.com/posts/immutable-architecture/)
- Vladimir Khorikov - [DDD in Legacy Projects](https://www.pluralsight.com/courses/domain-driven-design-legacy-projects)
- Vladimir Khorikov - [Refactoring from Anemic Domain Model](https://www.pluralsight.com/courses/refactoring-anemic-domain-model)
- Vladimir Khorikov - [Applying Functional Principles in C#](https://www.pluralsight.com/courses/csharp-applying-functional-principles)
- Eric Elliott - [Mocking is a Code Smell](https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a)
- Eric Elliott - [Encapsulation in JavaScript](https://medium.com/javascript-scene/encapsulation-in-javascript-26be60e325b4)
- Martin Fowler - [Monolith First](https://martinfowler.com/bliki/MonolithFirst.html)
- Martin Fowler - [CQRS](https://martinfowler.com/bliki/CQRS.html)
- Martin Fowler - [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- Martin Fowler - [Anemic Domain Model](https://martinfowler.com/bliki/AnemicDomainModel.html)
- Khalil Stemmler - [DDD Forum](https://github.com/stemmlerjs/ddd-forum)
- Matt Ho - [Serverless Event Sourcing with Go](https://www.youtube.com/watch?v=B-reKkB8L5Q)
- Kamil Grzybek - [Modular Monolith with DDD](https://github.com/kgrzybek/modular-monolith-with-ddd)
- Gary Bernhardt - [Functional Core, Imperative Shell](https://www.youtube.com/watch?v=yTkzNHF6rMs)
- Allard Buijze - [Event-Driven Microservices](https://www.youtube.com/watch?v=jrbWIS7BH70)
- Frans van Buul - [The Big Friendly Monolith](https://www.youtube.com/watch?v=NgVk74f5Jes)
- Nakul Mishra - [CQRS and EventSourcing with Spring & Axon](https://www.youtube.com/watch?v=hkJ29ER1EZU)
- Kai Sassnowski - [Database Indexing](https://www.youtube.com/watch?v=HubezKbFL7E)
- Eric Evans - [Domain Driven Design](https://www.amazon.ca/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215/ref=pd_lpo_1?pd_rd_i=0321125215&psc=1)
- Michiel Overeem - [The Dark Side of Event Sourcing](https://www.movereem.nl/files/2017SANER-eventsourcing.pdf)
- Joris Kuipers - [Day 2 problems in CQRS and Event Sourcing](https://www.youtube.com/watch?v=73KxyTUU4nU)