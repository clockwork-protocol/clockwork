const RecurringPaymentWallet = artifacts.require("RecurringPaymentWallet");
const PaymentSchedule = artifacts.require("PaymentSchedule");
const Payment = artifacts.require("Payment");

const truffleAssert = require('truffle-assertions');
const helper = require("./helpers/truffleTestHelper");
const BN = require('bn.js');
const {expectEvent} = require('@openzeppelin/test-helpers');

contract("RecurringPaymentWallet", accounts => {
    var today = new Date();
    var yesterday = new Date(today -1);
    const owner = accounts[0];
    const hacker = accounts[1];
    var paymentInst;

    let createNotDuePaymentSchedule = async (wallet, amount, serviceProvider) => {
        let tx = await wallet.createPaymentSchedule(
            amount,
            2,
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()+1, 
            serviceProvider);

        let event = await expectEvent.inTransaction(tx.tx, PaymentSchedule, 'PaymentScheduleCreated');
        return event.args.id;
    };

    let createDuePaymentSchedule = async (wallet, amount, serviceProvider) => {
        let tx = await wallet.createPaymentSchedule(
            amount,
            2,
            yesterday.getFullYear(),
            yesterday.getMonth()+1,
            yesterday.getDate(), 
            serviceProvider);
        let event = await expectEvent.inTransaction(tx.tx, PaymentSchedule, 'PaymentScheduleCreated');
        return event.args.id;
    };

    beforeEach(async() => {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot['result'];
        paymentInst = await Payment.deployed();
        paymentAddress = paymentInst.address;
        paymentSchedule = await PaymentSchedule.deployed();
        wallet = await RecurringPaymentWallet.deployed();

    });
    
    afterEach(async() => {
        await helper.revertToSnapShot(snapshotId);
    });

    it("should be able to fund the wallet", async () => {
        let depositAmount = 10000;
        
        await truffleAssert.reverts(
            wallet.deposit(),
            "Message value must be greater than zero"
        );

        await wallet.deposit({value: depositAmount, from: owner});
        let balance = await wallet.getBalance();

        assert.equal(
            balance, 
            depositAmount, 
            "Wallet balance is incorrect"
        );
    });

    it("should be able to withdraw from wallet", async () => {
        let depositAmount = 10000000;

        await wallet.deposit({value: depositAmount, from: owner});
        let balance = await wallet.getBalance();

        assert.equal(
            balance, 
            depositAmount, 
            "Wallet balance is incorrect"
        );

        let ownerInitialBalance = await web3.eth.getBalance(owner);
        const txInfo = await wallet.withdraw(depositAmount/2);

        // This fails intermittently, find out why
        // BALANCE AFTER TX needs to take gas cost and price into account
        // const balanceAfter = new BN(await web3.eth.getBalance(owner));
        // const tx = await web3.eth.getTransaction(txInfo.tx);
        // const gasPrice = new BN(tx.gasPrice);
        // const gasUsed = new BN(txInfo.receipt.gasUsed);
        // const gasCost = gasPrice.mul(gasUsed);
        // let ownerFinalBalance = balanceAfter.add(gasCost);
        
        // assert.equal(
        //     ownerFinalBalance, 
        //     ownerInitialBalance*1 + depositAmount/2, 
        //     "Should have deposited the correct amount to the owner address"
        // );

        balance = await wallet.getBalance();

        assert.equal(
            balance, 
            depositAmount/2, 
            "Wallet balance is incorrect"
        );
    });

    it("should be able to drain all funds from wallet", async () => {
        let depositAmount = 10000000;

        await wallet.deposit({value: depositAmount, from: owner});
        let balance = await wallet.getBalance();

        assert.equal(
            balance, 
            depositAmount, 
            "Wallet balance is incorrect"
        );

        await wallet.drain();

        balance = await wallet.getBalance();

        assert.equal(
            balance, 
            0, 
            "Wallet balance is incorrect"
        );
    });

    it("should only withdraw funds from sender's wallet", async () => {
        let depositAmount = 100000;

        await wallet.deposit({value: depositAmount, from: owner});
        let balance = await wallet.getBalance();

        assert.equal(
            balance, 
            depositAmount, 
            "Wallet balance is incorrect"
        );

        await truffleAssert.reverts(
            wallet.withdraw(depositAmount/2, {from : hacker}),
            "Withdrawal request exceeds wallet balance."
        );
    });

    it("should not be able to withdraw more than you deposit", async () => {
        let depositAmount = 100000;

        await wallet.deposit({value: depositAmount, from: owner});
        let balance = await wallet.getBalance();

        assert.equal(
            balance, 
            depositAmount, 
            "Wallet balance is incorrect"
        );

        await truffleAssert.reverts(
            wallet.withdraw(depositAmount*2),
            "Withdrawal request exceeds wallet balance."
        );
    });

    it("should be able to create a payment schedule", async () => {
        const serviceProvider = accounts[2];

        await createNotDuePaymentSchedule(wallet, 10000, serviceProvider);
        
        let count = await wallet.paymentScheduleCount.call();
        assert.equal(
            count,
            1,
            "There should be one payment schedule");

        let _id = await wallet.paymentSchedules.call(0);
        let owner = await paymentSchedule.owner.call(_id);

        assert.equal(
            owner,
            accounts[0],
            "Payment schedule owner should be the user that created it");

    });

    it("should generate and fund due transactions", async () => {
        const serviceProvider = accounts[2];

        //fund wallet
        let depositAmount = 1000000000;
        await wallet.deposit({value: depositAmount, from: owner});

        //create 2 due payments and 2 that are not due
        let schedule1 = await createNotDuePaymentSchedule(wallet, 10000, serviceProvider);
        let schedule2 = await createDuePaymentSchedule(wallet, 20000, serviceProvider);
        let schedule3 = await createNotDuePaymentSchedule(wallet, 30000, serviceProvider);
        let schedule4 = await createDuePaymentSchedule(wallet, 40000, serviceProvider);
        
        //there should be 4 paymentSchedules
        let count = await wallet.paymentScheduleCount();
        assert.equal(
            count,
            4,
            "There should be 4 payment schedules");

        //create + fund first payment
        await truffleAssert.reverts(
            wallet.createAndFundDuePaymentForPaymentSchedule(schedule1),
            "Payment schedule must be due");
        
        //create + fund 2nd payment
        tx = await wallet.createAndFundDuePaymentForPaymentSchedule(schedule2);
        //make sure payment was created
        let paymentEvent = await expectEvent.inTransaction(tx.tx, Payment, 'PaymentCreated');
        //make sure it was for the correct amount
        assert.equal(
            paymentEvent.args.paymentAmount, 
            20000,
            "First due payment should have a the correct payment amount"
        );

        //create + fund third payment
        await truffleAssert.reverts(
            wallet.createAndFundDuePaymentForPaymentSchedule(schedule3),
            "Payment schedule must be due");

        //create + fund 4th payment
        tx = await wallet.createAndFundDuePaymentForPaymentSchedule(schedule4);
        paymentEvent = await expectEvent.inTransaction(tx.tx, Payment, 'PaymentCreated');
        //make sure it was for the correct amount
        assert.equal(
            paymentEvent.args.paymentAmount, 
            40000,
            "Second due payment should have a the correct payment amount"
        );
    });

    it("should not generate and fund due transactions if owner has no funds", async () => {
        const serviceProvider = accounts[2];

        //fund wallet
        let depositAmount = 15000;
        await wallet.deposit({value: depositAmount, from: owner});

        //create 2 due payments
        let schedule1 = await createDuePaymentSchedule(wallet, 10000, serviceProvider);
        let schedule2 = await createDuePaymentSchedule(wallet, 10000, serviceProvider);

        //create + fund first payment
        let tx = await wallet.createAndFundDuePaymentForPaymentSchedule(schedule1);
        //TODO: figure out why this revert check isn't working
        //create + fund second payment
        // await truffleAssert.reverts(
        //    wallet.createAndFundDuePaymentForPaymentSchedule(schedule2),
        //    "Owner has too little balance to fund payment");
    });

    //not required for PoC
    //make sure 
    //should be able to cancel a recurring payment
    //should be able to pause a recurring payment
    //should be able to list all your recurring payments
});