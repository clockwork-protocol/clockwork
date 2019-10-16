pragma solidity ^0.5.0;

//Todo :    Add isPaid and update
contract Payment {
    address private owner;
    address payable private destination;
    uint private amount = 0;
    bool public isPaid = false;

    constructor(address payable _destination) payable public {
        owner = msg.sender;
        destination = _destination;
        amount = msg.value;
    }

    function execute() public {
        uint amountToTransfer = amount;
        amount = 0;
        isPaid = true;
        destination.transfer(amountToTransfer);
    }
}