const PaymentSchedule = artifacts.require("PaymentSchedule");
const Payment = artifacts.require("Payment");
const helper = require("./helpers/truffleTestHelper");
const truffleAssert = require('truffle-assertions');

contract("PaymentSchedule", accounts => {
    beforeEach(async() => {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot['result'];
    });
    
    afterEach(async() => {
        await helper.revertToSnapShot(snapshotId);
    });

    it("should be due if last payment has not been made", async () => {    
        var today = new Date();
        let owner = accounts[1];
        let serviceProvider = accounts[2];
        let monthlyPayment = 10000000;

        let subscription = await PaymentSchedule.new(monthlyPayment, today.getFullYear(),today.getMonth()+1,today.getDate()+1, owner, serviceProvider);
 
        let isDue = await subscription.isDue();
        assert.equal(
            isDue, 
            false, 
            "Subscription is not due until T+1 day");

        const newBlock = await helper.advanceTimeAndBlock(helper.daysToSeconds(2));
        
        isDue = await subscription.isDue();
        assert.equal(
            isDue, 
            true, 
            "Subscription should be due");
    });

    it("should set constructor parameters correctly", async () => {
        var today = new Date();
        let owner = accounts[1];
        let serviceProvider = accounts[2];
        let monthlyPayment = 10000000;

        let subscription = await PaymentSchedule.new(monthlyPayment,today.getFullYear(),today.getMonth()+1,today.getDate()+1, owner, serviceProvider);

        let subscriptionOwner = await subscription.owner();
        assert.equal(
            subscriptionOwner, 
            owner, 
            "Owner should be set correctly");

        let subscriptionServiceProvider = await subscription.serviceProvider();
        assert.equal(
            subscriptionServiceProvider, 
            serviceProvider, 
            "Service provider should be set correctly");

    });

    it("should not create a new payment if it isn't due", async () => {
        var today = new Date();
        let owner = accounts[1];
        let serviceProvider = accounts[2];
        let monthlyPayment = 10000000;

        let subscription = await PaymentSchedule.new(monthlyPayment, today.getFullYear(),today.getMonth()+1,today.getDate()+1, owner, serviceProvider);
        //check that the subscription is due
        isDue = await subscription.isDue();
        assert.equal(
            isDue, 
            false, 
            "Subscription should not be due");
            
        await truffleAssert.reverts(
            subscription.createPayment(),
            "Subscription must be due to create a payment"
        );
    });

    // it("should return a new payment if it's due", async () => {
    //     var today = new Date();
    //     let owner = accounts[1];
    //     let serviceProvider = accounts[2];
    //     let monthlyPayment = 10000000;

    //     let subscription = await PaymentSchedule.new(monthlyPayment, today.getFullYear(),today.getMonth()+1,today.getDate()-1, owner, serviceProvider);
    //     //check that the subscription is due
    //     isDue = await subscription.isDue();
    //     assert.equal(
    //         isDue, 
    //         true, 
    //         "Subscription should be due");
            
    //     //Check that the pyment is not paid
    //     let newPayment = await subscription.createPayment();
    //     // let isPaid = await newPayment.isPaid();
    //     // assert.equal(
    //     //     isPaid, 
    //     //     false, 
    //     //     "The new payment should be marked as unpaid."
    //     // );
    // });

    // it("should be overdue due if next payment date is moe than paymentLeeway days in the past and payment has not been made", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should not allow payment leeway of less than 1 day", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should only create a payment if payment date is in the past and there is no payment for that date", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should have a list of past payments", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should not be overdue once payment has been made", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should not create new due payments while the subsription is overdue", async () => {
        
    // });
});