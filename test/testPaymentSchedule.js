const PaymentSchedule = artifacts.require("PaymentSchedule");
const Payment = artifacts.require("Payment");
const helper = require("./helpers/truffleTestHelper");
const truffleAssert = require('truffle-assertions');

contract("PaymentSchedule", accounts => {
    var today = new Date();
    let owner = accounts[1];
    let destination = accounts[2];

    beforeEach(async() => {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot['result'];
    });
    
    afterEach(async() => {
        await helper.revertToSnapShot(snapshotId);
    });

    it("should be due if last payment has not been made", async () => {    
        let monthlyPayment = 10000000;

        let paymentSchedule = await PaymentSchedule.new(monthlyPayment, today.getFullYear(),today.getMonth()+1,today.getDate()+1, owner, destination);
 
        let isDue = await paymentSchedule.isDue();
        assert.equal(
            isDue, 
            false, 
            "paymentSchedule is not due until T+1 day");

        const newBlock = await helper.advanceTimeAndBlock(helper.daysToSeconds(2));
        
        isDue = await paymentSchedule.isDue();
        assert.equal(
            isDue, 
            true, 
            "paymentSchedule should be due");
    });

    it("should set constructor parameters correctly", async () => {
        let monthlyPayment = 10000000;

        let paymentSchedule = await PaymentSchedule.new(monthlyPayment,today.getFullYear(),today.getMonth()+1,today.getDate()+1, owner, destination);

        let paymentScheduleOwner = await paymentSchedule.owner();
        assert.equal(
            paymentScheduleOwner, 
            owner, 
            "Owner should be set correctly");

        let paymentScheduledestination = await paymentSchedule.destination();
        assert.equal(
            paymentScheduledestination, 
            destination, 
            "Service provider should be set correctly");

    });

    it("should not create a new payment if it isn't due", async () => {
        let monthlyPayment = 10000000;

        let paymentSchedule = await PaymentSchedule.new(monthlyPayment, today.getFullYear(),today.getMonth()+1,today.getDate()+1, owner, destination);
        //check that the paymentSchedule is due
        isDue = await paymentSchedule.isDue();
        assert.equal(
            isDue, 
            false, 
            "paymentSchedule should not be due");
            
        await truffleAssert.reverts(
            paymentSchedule.createPayment(),
            "PaymentSchedule must be due to create a payment"
        );
    });

    it("should return a new payment if it's due", async () => {
        let monthlyPayment = 10000000;

        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment, 
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()-1, 
            owner, 
            destination,
            {value: monthlyPayment, from: destination});

        //check that the paymentSchedule is due
        isDue = await paymentSchedule.isDue();
        assert.equal(
            isDue, 
            true, 
            "PaymentSchedule should be due");
            
        //Check that the pyment is not paid
        let result = await paymentSchedule.createPayment();
        currentPaymentAddress = await paymentSchedule.currentPayment();
        let currentPayment = await Payment.at(currentPaymentAddress);
        let isPaid = await currentPayment.isPaid.call();
        assert.equal(
             isPaid, 
             false, 
             "The new payment should be marked as unpaid."
        );
    });

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