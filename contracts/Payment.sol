pragma solidity ^0.5.0;


contract Payment {

    struct PaymentDetails {
        bytes32 id;
        uint overdueDate;
        uint paymentAmount;
        address payable destination;
    }

    struct PaymentStatus {
        bool executed;
        uint balance;
        uint overdueDate;
    }

    event PaymentCreated(bytes32 id, uint overdueDate, uint paymentAmount, address payable destination);
    event PaymentExecuted(bytes32 id);

    PaymentDetails[] public payments;
    mapping(bytes32 => PaymentStatus) public paymentStatus;

    constructor () public {
        bytes32 nullPaymentId;
        paymentStatus[nullPaymentId].executed = true;
    }

    function paymentCount()
        external
        view
        returns(uint)
    {
        return payments.length;
    }

    function paymentAmount(uint _index)
        external
        view
        returns(uint)
    {
        return payments[_index].paymentAmount;
    }

    function isOverdue(uint _index)
        external
        view
        returns(bool)
    {
        PaymentDetails memory paymentDetails = payments[_index];
        return block.timestamp > paymentDetails.overdueDate && !paymentStatus[paymentDetails.id].executed;
    }

    function isOverdue(bytes32 _id)
        external
        view
        returns(bool)
    {
        return block.timestamp > paymentStatus[_id].overdueDate && !paymentStatus[_id].executed;
    }

    function isExecuted(bytes32 _id)
        external
        view
        returns(bool)
    {
        return paymentStatus[_id].executed;
    }

    function execute(uint _index)
        external
    {
        require(_index < payments.length, "Index out of bounds");
        //Get the payment at _index
        PaymentDetails memory paymentDetails = payments[_index];

        //check that we can execute this payment
        require(paymentStatus[paymentDetails.id].executed == false, "Payment has already executed");
        require(isFunded(_index), "Payment not funded");
        require(paymentStatus[paymentDetails.id].balance >= paymentDetails.paymentAmount, "Insufficient funds to execute payment");

        //set payment to executed and drain balance
        paymentStatus[paymentDetails.id].executed = true;
        paymentStatus[paymentDetails.id].balance = 0;

        //remove the payment at _index
        removePayment(_index);

        //execute the transfer
        paymentDetails.destination.transfer(paymentDetails.paymentAmount);

        emit PaymentExecuted(paymentDetails.id);
    }

    function createPayment(address payable _destination, uint _paymentAmount, uint _overdueDate)
        public
        payable
        returns(bytes32)
    {
        //make sure funds are sent
        require(msg.value >= _paymentAmount, "Insufficient funds sent to fund payment");

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

        //Store payment details
        PaymentDetails memory payment = PaymentDetails(
            _paymentId,
            _overdueDate,
            _paymentAmount,
            _destination);

        payments.push(payment);

        //set payment status
        paymentStatus[_paymentId].executed = false;
        paymentStatus[_paymentId].balance = msg.value;
        paymentStatus[_paymentId].overdueDate = _overdueDate;

        emit PaymentCreated(
            _paymentId,
            _overdueDate,
            _paymentAmount,
            _destination);

        return _paymentId;
    }

    function isFunded(uint _index)
        public
        view
        returns(bool)
    {
        return paymentStatus[payments[_index].id].balance >= 0;
    }

    function removePayment(uint _index)
        internal
    {
        require(_index < payments.length, "Index out of bounds");
        payments[_index] = payments[payments.length-1];
        delete payments[payments.length-1];
        payments.length--;
    }
}