const Payment = artifacts.require("Payment");
const truffleAssert = require('truffle-assertions');

contract("Payment", accounts => {
    let destination = accounts[2];
    let source = accounts[1];
    let payment = 1000000000000000;

    it("should pay the destination the appropriate amount", async () => {
        //get account balances before payment
        let destinationInitialBalance = await web3.eth.getBalance(destination);
        
        //create a new payment
        let newPayment = await Payment.new(
            destination, 
            payment, 
            0,
            {value: payment, from: source});

        let isPaid = await newPayment.isPaid.call();
        assert.equal(
            isPaid, 
            false, 
            "A new payment should be marked as unpaid."
        );

        //get account balances before payment
        let destinationBalance = await web3.eth.getBalance(destination);    

        assert.equal(
            destinationInitialBalance,
            destinationBalance,
            "Destination should not receive payment until after payment executed"
        );

        let result = await newPayment.execute();
        destinationBalance = await web3.eth.getBalance(destination);

        assert.equal(
            destinationBalance,
            (destinationInitialBalance*1) + (payment*1),
            "Destination should receive payment after payment executed"
        );

        isPaid = await newPayment.isPaid.call();
        assert.equal(
            isPaid, 
            true, 
            "Payment should be marked as paid after the payment is complete."
        );
    });

    it("should set payment amount correctly", async () => {
        //create a new payment
        let newPayment = await Payment.new(
            destination, 
            payment, 
            0,
            {value: payment, from: source});

        let paymentAmount = await newPayment.paymentAmount.call();
        assert.equal(
            paymentAmount, 
            payment, 
            "Payment amount should be correct."
        );
    });

    it("should not execute if the contract doesn't have enough funds", async () => {   
        let fundAmount = payment - 100;     
        //create a new payment but fund it with less than is required
        let newPayment = await Payment.new(
            destination, 
            payment, 
            0,
            {value: fundAmount, from: source});

        let isPaid = await newPayment.isPaid.call();
        assert.equal(
            isPaid, 
            false, 
            "A new payment should be marked as unpaid."
        );  

        await truffleAssert.reverts(
            newPayment.execute(),
            "Insufficient funds to execute payment"
        );
    });

    it("should only execute once", async () => {
        //create a new payment
        let newPayment = await Payment.new(
            destination, 
            payment, 
            0,
            {value: payment, from: source});

        let isPaid = await newPayment.isPaid.call();
        assert.equal(
            isPaid, 
            false, 
            "A new payment should be marked as unpaid."
        );

        //execute the payment
        let result = await newPayment.execute();

        //check that it is paid
        isPaid = await newPayment.isPaid.call();
        assert.equal(
            isPaid, 
            true, 
            "Payment should be marked as paid after the payment is complete."
        );
        
        //try execute it again
        await truffleAssert.reverts(
            newPayment.execute(),
            "Payment has already executed"
        );
    });

    it("should only be funded if the contract balance equals or exceeds the payment amount", async () => {
        let fundAmount = payment - 100;     
        //create a new payment but fund it with less than is required
        let newPayment = await Payment.new(
            destination, 
            payment, 
            0,
            {value: fundAmount, from: source});

        //check that it is not funded
        isFunded = await newPayment.isFunded.call();
        assert.equal(
            isFunded, 
            false, 
            "Payment should not be funded if contract balance is less than payment amount."
        );

        newPayment = await Payment.new(
            destination, 
            payment,
            0);
        //check that it is not funded
        isFunded = await newPayment.isFunded.call();
        assert.equal(
            isFunded, 
            false, 
            "Payment should not be funded if contract balance is zero."
        );

        newPayment = await Payment.new(
            destination, 
            payment,
            0, 
            {value: payment, from: source});
        //check that it is funded
        isFunded = await newPayment.isFunded.call();
        assert.equal(
            isFunded, 
            true, 
            "Payment should be funded if contract balance equals the payment amount."
        );

        newPayment = await Payment.new(
            destination, 
            payment, 
            0,
            {value: payment+100, from: source});
        //check that it is funded
        isFunded = await newPayment.isFunded.call();
        assert.equal(
            isFunded, 
            true, 
            "Payment should be funded if contract balance exceeds the payment amount."
        );
    });

    // it("should be overdue if not paid after overdue date", async () => {});

    // it("should only pay the correct amount and return the excess to the funding contract", async () => {});
});