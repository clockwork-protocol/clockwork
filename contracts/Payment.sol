pragma solidity ^0.5.0;

//Todo :
// store the funding contract and return any excess funds to funding contract (security implications here?)
contract Payment {
    address private owner;
    address payable private destination;
    uint private amount = 0;
    uint public paymentAmount = 0;
    bool public isPaid = false;

    constructor(address payable _destination, uint _paymentAmount) payable public {
        owner = msg.sender;
        destination = _destination;
        amount = msg.value;
        paymentAmount = _paymentAmount;
    }

    function execute() public {
        require(isPaid == false, "Payment has already executed");
        require(amount >= paymentAmount, "Insufficient funds to execute payment");
        amount = amount - paymentAmount;
        isPaid = true;
        destination.transfer(paymentAmount);
    }
}