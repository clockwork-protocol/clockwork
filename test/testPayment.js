const Payment = artifacts.require("Payment");
const truffleAssert = require('truffle-assertions');

contract("Payment", accounts => {
    let destination = accounts[2];
    let source = accounts[1];
    let payment = 1000000000000000;

    it("should pay the destination the appropriate amount", async () => {
        //get account balances before payment
        let destinationInitialBalance = await web3.eth.getBalance(destination);
        let paymentInst = await Payment.deployed();

        //create a new payment
        let tx = await paymentInst.createPayment(
            destination, 
            payment, 
            0,
            {value: payment, from: source});

        //check event was emitted
        var event;
        truffleAssert.eventEmitted(tx, 'PaymentCreated', (ev) => {
            event = ev;
            return true;
        });
        //capture the payment ID
        let paymentID = event.id;

        //check payment has not executed
        let isExecuted = await paymentInst.isExecuted.call(paymentID);
        assert.equal(
            isExecuted, 
            false, 
            "A new payment should be marked as un-executed."
        );

        //get account balances before payment
        let destinationBalance = await web3.eth.getBalance(destination);    

        assert.equal(
            destinationInitialBalance,
            destinationBalance,
            "Destination should not receive payment until after payment executed"
        );

        //execute the first payment
        let result = await paymentInst.execute(paymentID);
        truffleAssert.eventEmitted(result, "PaymentExecuted");
        
        destinationBalance = await web3.eth.getBalance(destination);

        assert.equal(
            destinationBalance,
            (destinationInitialBalance*1) + (payment*1),
            "Destination should receive payment after payment executed"
        );
        
        isExecuted = await paymentInst.isExecuted.call(paymentID);
        assert.equal(
            isExecuted, 
            true, 
            "Payment should be marked as executed after the payment is complete."
        );
    });

    it("should set payment amount correctly", async () => {
        //create a new payment
        let paymentInst = await Payment.deployed();
        let tx = await paymentInst.createPayment(
            destination, 
            payment, 
            0,
            {value: payment, from: source});

        //check event was emitted
        var event;
        truffleAssert.eventEmitted(tx, 'PaymentCreated', (ev) => {
            event = ev;
            return true;
        });

        assert.equal(
            event.paymentAmount, 
            payment, 
            "Payment amount should be correct."
        );
    });

    it("should not be able to create a payment if insufficient funds sent", async () => {   
        let fundAmount = payment - 100;     
        //create a new payment
        let paymentInst = await Payment.deployed();

        await truffleAssert.reverts(
            paymentInst.createPayment(
                destination, 
                payment, 
                0,
                {value: fundAmount, from: source}),
            "Insufficient funds sent to fund payment"
        );
    });

    // it("should be overdue if not paid after overdue date", async () => {});

    // it("should only pay the correct amount and return the excess to the funding contract", async () => {});
});