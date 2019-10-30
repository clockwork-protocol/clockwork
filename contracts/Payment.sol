pragma solidity ^0.5.0;

//Todo :
// store the funding contract and return any excess funds to funding contract (security implications here?)
contract Payment {
    address private owner = msg.sender;
    address payable private destination;
    uint private overdueDate;
    uint public paymentAmount = 0;
    bool public isPaid = false;

    constructor(address payable _destination, uint _paymentAmount, uint _overdueDate)
        payable
        public
    {
        destination = _destination;
        paymentAmount = _paymentAmount;
        overdueDate = _overdueDate;
    }

    function isFunded()
        public
        view
        returns(bool)
    {
        return address(this).balance >= paymentAmount;
    }

    function isOverdue()
        external
        view
        returns(bool)
    {
        return block.timestamp > overdueDate && !isPaid;
    }

    function execute()
        external
    {
        require(isPaid == false, "Payment has already executed");
        require(isFunded(), "Insufficient funds to execute payment");
        isPaid = true;
        destination.transfer(paymentAmount);
    }
}