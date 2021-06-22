# Serverless Event Sourcing
This documents my adventure into the world of immutability to solve common distributed system problems.

Work in progress!


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
- Connecting pool tweaking


This results in a middleware stack that is highly complex, requires extensive documentation for a newly onboarded developers to understand, and adds no business value (feature wise).
What if we can outsource all this to Amazon and focus on adding features?



# Decomposition

## Attempt #1 - Transaction Script

Works when the underlying operation is truly CRUD.

### What we think happened:

![](https://i.gyazo.com/a1fca91d8290e3ed53149878ddf57d2b.png)

- Database centric thinking
- CRUD centric thinking


### What a domain expert thinks happened:

- Behaviour/fact based
- Workflow/time based


### Pros
- Implementation time

### Cons
- Mismatch between business domain and code
- Business logic cannot be unit tested in isolation


## Attempt #2 - DDD Aggregate

- Business logic coupling
- Use case only calls a small portion of the overall aggregates behaviour
- Only a small percentage of the entire aggregates' preconditions are checked for the command

### Pros
- Business logic can be unit tested in isolation

### Cons
- Business logic coupling since the aggregates behaviour is the common denominator of all commands it handles


## Solution - Functional core per request with Event Sourcing

### Pros
- Loose coupling
- More code
- Aligned with the business


### Cons
- Implementation time


## Storage normalization downsides
![](https://www.interfacett.com/wp-content/uploads/2014/08/001-Multiple-Joins-Work-just-like-Single-Joins.png)

- Query complexity
- Slow OLAP queries
- Performance
- Combinatorial explosion of code paths in the database that requires integration tests
- Query logic can become more complex than the command logic
- Accidental complexity, can be solved with CQRS


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


### Primary key schema

| Hash Key        | Range Key
| ------------- |:-------------:|
| `aggregateId`      | `version`

## Http Rest API - API Gateway


## Websockets - API Gateway


## DNS Cutover - CloudFlare Workers/Load Balancing
Weighted canary release to new API gateway (see: [here](https://developers.cloudflare.com/load-balancing/understand-basics/weighted-load-balancing))

## Command Handlers - Lambda
![](https://theburningmonk.com/wp-content/uploads/2019/08/img_5d5fe26a0551d.png)

- One lambda per command
- Writes to event store

## ~~Subscriptions Attempt #1 - Event Bus with Kinesis~~

-  ~~DynamoDB has native replication to Kinesis~~
-  ~~Kinesis has ordering guarantees per dynamodb partition~~
-  ~~This allowed in-order replay of aggregates even with competing consumers~~

Conclusion:
- Too many failure points to be considered for production (retry/max retention time, dead letter queue).
- Complexity
- Direct Kinesis integration to Dynamo does not have ordering guarantees per partition key

## ~~Subscriptions Attempt #2 - Event Bus with DynamoDb Streams~~
Conclusion: 
- Too many failure points to be considered for production (retry/24 hour retention time, dead letter queue).
- Complexity

## ~~Subscriptions Attempt #3 - Dynamo Global Secondary Index on Aggregate Name sorted by Aggregate ID~~

~~Example: Live update of all wallets who were credited at least once in the last 30 days and also clicked a green button
~~Divide and conquer across aggregate names:~~
~~1. Live update of all wallets who were credited at least once in the last 30 days~~
~~2. Clicked a green button~~
~~3. Left join 1 and 2~~~

Conclusion:
- DynamoDB does not having the global ordering guarantees we need, global projections would become very complex since ordering is only guaranteed on a per-aggregate level


## Subscriptions Attempt #4 - Postgres with custom write strategy

- Poll events table
- Compensate for gaps asynchronously
- Benchmark performance
- Use bull + outbox pattern to message external consumers at leas tonce
- Copy https://github.com/WegenenVerkeer/akka-persistence-postgresql

There can be gaps in the postgresql sequence due to atomicity, we need to account for this using something special for the persistent subscription.


## Projectors - Lambda
![](https://theburningmonk.com/wp-content/uploads/2019/08/img_5d5fe26a0551d.png)

- One lambda per read model with competing consumers
- Events received from Kinesis


## Read Model Store #1 - DynamoDB
- Stores read models that can be fit within a single document (under 400kb)


## Read Model Store #2 - ElasticSearch
- Stores read models that cannot be fit within a single document and require a balanced search tree or full text search for indexing
