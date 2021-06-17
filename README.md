# Serverless Event Sourcing

![](https://jj09.net/wp-content/uploads/2018/12/ddd-diagram-example.png)

DDD, CQRS & ES is a vast, complex topic. 

DDD & CQRS can be applied to many existing legacy systems with relative ease by using native relational database replication mechanisms such as Postgres' streaming/logical replication. This tends to work for 95% of use-cases where queries can be answered with relatively simple SQL, but sometimes we see queries like the following:

![](https://www.interfacett.com/wp-content/uploads/2014/08/001-Multiple-Joins-Work-just-like-Single-Joins.png)

Add another 20 joins, a few group bys and we end up in a situation where data access to answer queries has more complexity than the business logic and requires integration tests to cover each branch of complexity.
As Greg Young talks about, this complexity is largely accidental, and comes from trying to fit a model that is event-based into a relational schema.

Wouldn't it be nice to selectively apply the **Event Sourcing** pattern with CQRS to be able to have more control over where this complexity resides for the complex core subdomains in our system?

---

**Event Sourcing with CQRS** is an incredibly powerful pattern, offering benefits such as:

- Immutable audit log of all business state changes
- Fast scalable writes
- Freedom from any sort of mapping when persisting aggregates
- Lack of relational table explosion to persist a complex business aggregate into a source of truth + queryable state
- Less cyclomatic complexity in data access logic that is hard to test due to the fact that read models are decoupled from the write model all the way down to persistence

... but has a large number of tradeoffs such as:

- Versioning of long-lived aggregates
- Versioning of event schemas
- Refactoring stream boundaries is difficult to correct once a system is in production
- Tight coupling of snapshots to the underlying left-fold that created the state
- Tight coupling of read models to the event store/schema
- Blue-green deployments
- Read model replay ordering guarantees
- Read model replay time with a large number of events


Most of these issues can be mitigated can be distilled to the fact that schema changes are not atomic like a relational database. Instead, event schema changes happen while two versions of the domain model event schema are live unless the system is fully taken offline & restarted.



The goal of this project is to setup serverless AWS infrastructure in an immutable fashion to try to mitigate the above tradeoffs and reap the benefits of the pattern.


## Immutable Infrastucture
- Allows simpler refactoring of wrong aggregate boundaries with a live production system
- Prevents the need to make events forwards compatible with blue-green deployments


## Tombstoning
- Allows for shorter streams of traditionally long-lived aggregate by using a special event to carry-forward state into a new stream.

### Examples
- Opening balance when your bank carries forward your credit card balance
- Closing the books at the end of an accounting year-end and bringing forward the closing balances of the general ledger




## Realtime stream processing
- Allows read models to be updated in realtime as long as we have an event ordering guarantee on a per-stream basis


## Scalability
- Partition aggregates to allow for pay as you go scalability, without worrying about things such as CPU/memory usage


# Event Store - DynamoDB

## Primary key schema
- This allows for an in-order replay guarantee on a per-stream basis.
- Allows for write scalability due to sharding based on a UUID key with high cardinality (`streamId`).

| Hash Key        | Range Key
| ------------- |:-------------:|
| `streamId`      | `sequenceNumber`


## Global secondary index #1 - AggregateId
This allows for location of the latest stream ID being written to for an aggregate id. 
Notice we only need the `streamId` projected into this index since it's the only field we're querying for.

| Hash Key        | Range Key | Projection Attributes
| ------------- |:-------------:|:-------------:|
| `aggregateId`      | `None`    | `streamId`




## Global secondary index #2 - AggregateName
This allows for a catch-up replay of all events for a particular aggregate name.

| Hash Key        | Range Key | Projection Attributes
| ------------- |:-------------:|:-------------:|
| `aggregateName`      | `None` | `ALL`


The plan is that we can sacrifice global ordering in exchange for scalability since **most** read models have a temporal dependency in terms of the aggregates they read from

- Example:  Find all players who signed up in the last 30 days who were credited money at least 3 times
    1. Step 1: Find all players who signed up in the last 30 days
    2. Step 2: Find all wallets who were credited money at least 3 times
    3. Step 3: Left join Step 1 to 2
    
 
Since there is no range key (which would be the global sequence/position), events are returned out of order.

We can get the events in order by doing some post processing before returning it to the client:

![](https://i.gyazo.com/fc546f22127714aa131e7b9edfd0a03f.png)


# Read Model Store #1 - DynamoDB
Stores read models that can be fit within a single document

### Examples:
- Top CAD wallet
- Top 3 EUR wallets
- Total money credited per day in the last 30 days


# Read Model Store #2 - ElasticSearch (WIP)
Stores read models that cannot be fit within a single document and require a balanced search tree or full text search for indexing

### Examples:
- Paginated transaction list of all transactions completed by a player


# Realtime Stream Processing - Kinesis/Dynamo (WIP)
Allows for read models to be updated in realtime with ordering guarantees on a per-stream basis.

# Inspiration
- Greg Young - [Versioning in an Event Sourced System](https://leanpub.com/esversioning/read)
- Adam Dymitruk - [Event Modeling](https://eventmodeling.org/)
- Matt Ho - [Serverless Event Sourcing with Go](https://www.youtube.com/watch?v=B-reKkB8L5Q)