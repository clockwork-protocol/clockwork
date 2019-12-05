pragma solidity ^0.5.0;

// todo
// See if we can use eventeum to execute txn's


contract Payment {

    struct PaymentDetails {
        bytes32 id;
        uint overdueDate;
        uint paymentAmount;
        address payable destination;
        bool executed;
        uint balance;
    }

    event PaymentCreated(bytes32 id, uint overdueDate, uint paymentAmount, address payable destination, uint timestamp);
    event PaymentExecuted(bytes32 id, uint timestamp);

    mapping(bytes32 => PaymentDetails) public payments;

    constructor () public {
        bytes32 nullPaymentId;
        payments[nullPaymentId].executed = true;
    }

    function paymentAmount(bytes32 _id)
        external
        view
        returns(uint)
    {
        return payments[_id].paymentAmount;
    }

    function isOverdue(bytes32 _id)
        external
        view
        returns(bool)
    {
        return block.timestamp > payments[_id].overdueDate && !payments[_id].executed;
    }

    function isExecuted(bytes32 _id)
        external
        view
        returns(bool)
    {
        return payments[_id].executed;
    }

    //TODO add execute by id method
    function execute(bytes32 _id)
        external
    {
        //Get the payment at _id
        PaymentDetails storage paymentDetails = payments[_id];

        //check that we can execute this payment
        require(paymentDetails.executed == false, "Payment has already executed");
        require(paymentDetails.balance >= 0, "Payment not funded");
        require(paymentDetails.balance >= paymentDetails.paymentAmount, "Insufficient funds to execute payment");

        //set payment to executed and drain balance
        paymentDetails.executed = true;
        paymentDetails.balance = 0;

        //execute the transfer
        paymentDetails.destination.transfer(paymentDetails.paymentAmount);

        emit PaymentExecuted(paymentDetails.id, block.timestamp);
    }

    function createPayment(address payable _destination, uint _paymentAmount, uint _overdueDate)
        public
        payable
        returns(bytes32)
    {
        //make sure funds are sent
        require(msg.value >= _paymentAmount, "Insufficient funds sent to fund payment");

        //Generate ID
        //is it ok to use block.timeStamp here or should we use a random number generator?
        bytes32 _paymentId = keccak256(
            abi.encodePacked(
                _overdueDate,
                _paymentAmount,
                false,
                _destination,
                msg.sender,
                block.timestamp
            )
        );

        //set payment details
        payments[_paymentId].id = _paymentId;
        payments[_paymentId].paymentAmount = _paymentAmount;
        payments[_paymentId].destination = _destination;
        payments[_paymentId].executed = false;
        payments[_paymentId].balance = msg.value;
        payments[_paymentId].overdueDate = _overdueDate;

        emit PaymentCreated(
            _paymentId,
            _overdueDate,
            _paymentAmount,
            _destination,
            block.timestamp);

        return _paymentId;
    }

    function isFunded(bytes32 _id)
        public
        view
        returns(bool)
    {
        return payments[_id].balance >= 0;
    }
}