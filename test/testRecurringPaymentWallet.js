const RecurringPaymentWallet = artifacts.require("RecurringPaymentWallet");
const PaymentSchedule = artifacts.require("PaymentSchedule");
const Payment = artifacts.require("Payment");

const truffleAssert = require('truffle-assertions');
const helper = require("./helpers/truffleTestHelper");
const BN = require('bn.js');

contract("RecurringPaymentWallet", accounts => {
    var today = new Date();
    var yesterday = new Date(today -1);
    const owner = accounts[0];
    const hacker = accounts[1];

    let createNotDuePaymentSchedule = async (wallet, amount, serviceProvider) => {
        return wallet.createPaymentSchedule(
            amount,
            2,
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()+1, 
            serviceProvider);
    };

    let createDuePaymentSchedule = async (wallet, amount, serviceProvider) => {
        return wallet.createPaymentSchedule(
            amount,
            2,
            yesterday.getFullYear(),
            yesterday.getMonth()+1,
            yesterday.getDate(), 
            serviceProvider);
    };

    beforeEach(async() => {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot['result'];
    });
    
    afterEach(async() => {
        await helper.revertToSnapShot(snapshotId);
    });

    it("should set constructor parameters correctly", async () => {
        let wallet = await RecurringPaymentWallet.new();
        let walletOwner = await wallet.owner();

        assert.equal(
            walletOwner, 
            owner, 
            "Wallet owner not set correctly"
        );
    });

    it("should be able to fund the wallet", async () => {
        let wallet = await RecurringPaymentWallet.new();
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
        let wallet = await RecurringPaymentWallet.new();
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

        // BALANCE AFTER TX needs to take gas cost and price into account
        const balanceAfter = new BN(await web3.eth.getBalance(owner));
        const tx = await web3.eth.getTransaction(txInfo.tx);
        const gasPrice = new BN(tx.gasPrice);
        const gasUsed = new BN(txInfo.receipt.gasUsed);
        const gasCost = gasPrice.mul(gasUsed);
        let ownerFinalBalance = balanceAfter.add(gasCost);
        
        assert.equal(
            ownerFinalBalance, 
            ownerInitialBalance*1 + depositAmount/2, 
            "Should have deposited the correct amount to the owner address"
        );

        balance = await wallet.getBalance();

        assert.equal(
            balance, 
            depositAmount/2, 
            "Wallet balance is incorrect"
        );
    });

    it("should only allow the owner of a wallet to withdraw funds", async () => {
        let wallet = await RecurringPaymentWallet.new();
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
            "Sender not authorized."
        );
    });

    it("should not be able to withdraw more than you deposit", async () => {
        let wallet = await RecurringPaymentWallet.new();
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
            "Withdrawal request exceeds balance"
        );
    });

    it("should be able to create a payment schedule", async () => {
        let wallet = await RecurringPaymentWallet.new();
        const serviceProvider = accounts[2];

        await createNotDuePaymentSchedule(wallet, 10000, serviceProvider);
        
        let count = await wallet.paymentScheduleCount();
        assert.equal(
            count,
            1,
            "There should be one payment schedule");

        //todo: 
        //  research the difference between calling functions that change state and ones that don't
        //  research Ethereum events
        let paymentScheduleAddress = await wallet.paymentSchedules(0);
        let paymentSchedule = await PaymentSchedule.at(paymentScheduleAddress);
        let owner = await paymentSchedule.owner();

        assert.equal(
            owner,
            wallet.address,
            "Payment schedule owner should be the payment schedule that created it");

    });

    it("should only allow wallet owner to create a payment schedule", async () => {
        let wallet = await RecurringPaymentWallet.new();
        const serviceProvider = accounts[2];

        await truffleAssert.reverts(
            wallet.createPaymentSchedule(
                10000,
                2,
                today.getFullYear(),
                today.getMonth()+1,
                today.getDate()+1, 
                serviceProvider, {from : hacker}),
            "Sender not authorized."
        );

    });

    it("should generate and fund due transactions", async () => {
        let wallet = await RecurringPaymentWallet.new();
        const serviceProvider = accounts[2];

        //fund wallet
        let depositAmount = 1000000000;
        await wallet.deposit({value: depositAmount, from: owner});

        //create 2 due payments and 2 that are not due
        await createNotDuePaymentSchedule(wallet, 10000, serviceProvider);
        await createDuePaymentSchedule(wallet, 20000, serviceProvider);
        await createNotDuePaymentSchedule(wallet, 30000, serviceProvider);
        await createDuePaymentSchedule(wallet, 40000, serviceProvider);
        
        //there should be 4 paymentSchedules
        let count = await wallet.paymentScheduleCount();
        assert.equal(
            count,
            4,
            "There should be 4 payment schedules");

        //create + fund first payment
        let tx = await wallet.createAndFundDuePaymentForPaymentSchedule(0);
        truffleAssert.eventNotEmitted(tx, 'DuePaymentCreated');

        //create + fund 2nd payment
        tx = await wallet.createAndFundDuePaymentForPaymentSchedule(1);
        var event;
        truffleAssert.eventEmitted(tx, 'DuePaymentCreated', (ev) => {
            event = ev;
            return true;
        });
        let payment = await Payment.at(event.duePayment);
        let paymentAmount = await payment.paymentAmount();
        assert.equal(
            paymentAmount,
            20000,
            "First due payment should have a the correct payment amount");

        //create + fund third payment
        tx = await wallet.createAndFundDuePaymentForPaymentSchedule(2);
        truffleAssert.eventNotEmitted(tx, 'DuePaymentCreated');

        //create + fund 4th payment
        tx = await wallet.createAndFundDuePaymentForPaymentSchedule(3);
        truffleAssert.eventEmitted(tx, 'DuePaymentCreated', (ev) => {
            event = ev;
            return true;
        });
        payment = await Payment.at(event.duePayment);
        paymentAmount = await payment.paymentAmount();
        assert.equal(
            paymentAmount,
            40000,
            "2nd due payment should have a the correct payment amount");

        //Test range asserts
        await truffleAssert.reverts(
            wallet.createAndFundDuePaymentForPaymentSchedule(-1),
            "Position out of range"
        );
        await truffleAssert.reverts(
            wallet.createAndFundDuePaymentForPaymentSchedule(4),
            "Position out of range"
        );
    });

    //not required for PoC
    //make sure 
    //should be able to cancel a recurring payment
    //should be able to pause a recurring payment
    //should be able to list all your recurring payments
});