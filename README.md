[![Coverage Status](https://coveralls.io/repos/github/clockwork-protocol/clockwork/badge.svg?branch=master)](https://coveralls.io/github/clockwork-protocol/clockwork?branch=master)

# Clockwork

Clockwork is a decentralized protocol that enables recurring payments on Ethereum to give users the ability to manage repeat payments entirely on-chain. Thus, Clockwork enables the use of cryptocurrency for subscription, SaaS, and other repeat-payment business models that have not been possible before.

## The problem
Although the decentralized financial infrastructure ecosystem has seen a rapid growth in protocols for stable coins, decentralised money markets and exchanges, among many others, to date, there is no efficient way to run trustless recurring payments with cryptocurrency. 
Recurring payments are the backbone of SaaS models and are a necessary component of any financial infrastructure. Traditional solutions in the fiat ecosystem have a number of inherent problems: They are expensive (credit card transaction fees regularly exceed 4%);  and they are fragmented from an end-users perspective. Since each payment is managed separately with the individual service provider, there is no easy way to track, cancel or change recurring monthly payments.

## What Clockwork does
Clockwork is a decentralised and crypto-native repeat payments solution. The Clockwork protocol enables decentralised repeat payments by incentivising the execution of recurring transactions while keeping all payment schedule information on chain. This will allow SaaS platforms to accept recurring crypto payments at much lower fees without having to build custom software and give users control of all their subscriptions in a single place. 
Use cases for the Clockwork protocol include:
Subscription collections and maintenance for SaaS entities and their customers. (Primary use case)
Payroll processing to allow DOA’s and other companies to pay regular salaries in crypto. (Potential additional use case)

## How it works
Clockwork is a protocol on the Ethereum blockchain that establishes a market for executing recurring payments. It does so by defining a relationship between payers, payees, transaction executors and management interfaces. Payments are denominated in DAI to avoid vollatility. In summary, the mechanism works as follows:
### Pre-funding contracts
Users send DAI to a shared funding contract. The funding contract acts like a prepaid debit card for all their recurring payments. This allows users to set budgets and manages the risk of having large amounts of funds locked up in a contract. These funding contracts create new payment schedules, keep track of all the payment schedules the user has signed up for, and fund payments generated by these payment schedules. Funding contracts can cancel or suspend payment schedules at any time.
### Payment schedules
Payment schedules set the payment terms, create and fund payments and keep track of payment histories and status. Schedules are always owned by a funding contract and can only be cancelled by the owner. On construction, the terms of the payment schedule are set and are immutable. To change the terms the old schedule must be cancelled and a new one created.
### Transaction execution
Once a transaction is created and funded by a payment schedule it is available publicly for execution. On execution it pays out a fee to the address set by the executor. This incentivises third parties to execute transactions on the Clockwork protocol for a fee.
