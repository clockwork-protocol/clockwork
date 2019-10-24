pragma solidity ^0.5.0;

//Todo :
// store the funding contract and return any excess funds to funding contract (security implications here?)
contract Payment {
    address private owner;
    address payable private destination;
    uint public paymentAmount = 0;
    bool public isPaid = false;

    constructor(address payable _destination, uint _paymentAmount) payable public {
        owner = msg.sender;
        destination = _destination;
        paymentAmount = _paymentAmount;
    }

    function isFunded() public view returns(bool) {
        return address(this).balance >= paymentAmount;
    }

    function execute() public {
        require(isPaid == false, "Payment has already executed");
        require(isFunded(), "Insufficient funds to execute payment");
        isPaid = true;
        destination.transfer(paymentAmount);
    }
}