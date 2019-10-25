const PaymentSchedule = artifacts.require("PaymentSchedule");
const Payment = artifacts.require("Payment");
const helper = require("./helpers/truffleTestHelper");
const truffleAssert = require('truffle-assertions');

contract("PaymentSchedule", accounts => {
    var today = new Date();
    let owner = accounts[1];
    let destination = accounts[2];
    let monthlyPayment = 10000000;

    //Helper function to get the latest payment froma payment schedule
    let getLatestPayment = async(paymentSchedule) => {
        latestPaymentAddress = await paymentSchedule.latestPayment(); //returns an address
        let latestPayment = await Payment.at(latestPaymentAddress); //get the payment at returned address
        return latestPayment;
    };

    beforeEach(async() => {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot['result'];
    });
    
    afterEach(async() => {
        await helper.revertToSnapShot(snapshotId);
    });

    it("should be due if last payment has not been made", async () => {
        let paymentSchedule = await PaymentSchedule.new(monthlyPayment, today.getFullYear(),today.getMonth()+1,today.getDate()+1, owner, destination);
 
        let isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            false, 
            "paymentSchedule is not due until T+1 day");

        const newBlock = await helper.advanceTimeAndBlock(helper.daysToSeconds(2));
        
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            true, 
            "paymentSchedule should be due");
    });

    it("should set constructor parameters correctly", async () => {
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
        let paymentSchedule = await PaymentSchedule.new(monthlyPayment, today.getFullYear(),today.getMonth()+1,today.getDate()+1, owner, destination);
        //check that the paymentSchedule is due
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            false, 
            "paymentSchedule should not be due");
            
        await truffleAssert.reverts(
            paymentSchedule.createNextPayment(),
            "PaymentSchedule must be due to create a payment"
        );
    });

    it("should return a new payment if it's due", async () => {
        //create a due payment
        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment, 
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()-1, 
            owner, 
            destination,
            {value: monthlyPayment, from: destination});

        //check that the paymentSchedule is due
        isNextPaymentDue = await paymentSchedule.isNextPaymentDue();
        assert.equal(
            isNextPaymentDue, 
            true, 
            "PaymentSchedule should be due");
            
        //Check that the pyment is not paid
        let result = await paymentSchedule.createNextPayment();
        let latestPayment = await getLatestPayment(paymentSchedule);
        let isPaid = await latestPayment.isPaid.call();
        assert.equal(
             isPaid, 
             false, 
             "The new payment should be marked as unpaid."
        );
    });

    it("should only create a new payment if the last payment has been made", async () => {
         //create a due payment
        let paymentSchedule = await PaymentSchedule.new(
            monthlyPayment, 
            today.getFullYear(),
            today.getMonth()+1,
            today.getDate()-1, 
            owner, 
            destination,
            {value: monthlyPayment*2, from: destination}); //creating 2 payments so need 2 payments
        
        //create a payment without paying it
        await paymentSchedule.createNextPayment();

        //try create a new payment, it should fail because nextDueDate has move on
        await truffleAssert.reverts(
            paymentSchedule.createNextPayment(),
            "PaymentSchedule must be due to create a payment"
        );
        
        //move time forward by one month
        const newBlock = await helper.advanceTimeAndBlock(helper.daysToSeconds(31));

        //create a new payment, it should fail because last payment hasn't been made yet
        await truffleAssert.reverts(
            paymentSchedule.createNextPayment(),
            "Can only create a new payment if last payment has been made"
        );

        //execute the payment
        let latestPayment = await getLatestPayment(paymentSchedule);
        await latestPayment.execute();

        //create a new payment, it should succeed
        await paymentSchedule.createNextPayment();
    });

    // it("should not allow payment leeway of less than 1 day", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should be overdue due if there is an outstanding payment that was due more than paymentLeeway days in the past", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should have a list of past payments", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should only have one due payment", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should not be overdue once due payment has been made", async () => {
    //     assert.equal(true,false, "Not yet implimented");
    // });

    // it("should only allow funding contracts as source", async () => {
        
    // });

    // it("should fund payments from the source payment contract", async () => {
        
    // });
});