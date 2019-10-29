pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/PaymentSchedule.sol";

contract RecurringPaymentWallet {
    uint public balance = 0;
    PaymentSchedule[] public paymentSchedules;
    address public owner = msg.sender;

    modifier onlyBy(address _account)
    {
        require(
            msg.sender == _account,
            "Sender not authorized."
        );
        _; //function body
    }

    function getBalance()
        public
        view
        returns(uint)
    {
        return address(this).balance;
    }

    function deposit()
        public
        payable
    {
        require(msg.value > 0, "Message value must be greater than zero");
    }

    //only owner
    function withdraw(uint _amount)
        public
        onlyBy(owner)
    {
        require(_amount <= address(this).balance, "Withdrawal request exceeds balance");
        msg.sender.transfer(_amount);
    }

    function createPaymentSchedule()
        public
        onlyBy(owner)
    {
    }

    function paymentScheduleCount()
        public
        returns(uint)
    {
    }

    function fundPayment(Payment payment)
        public
        returns(bool)
    {
    }

    function generateDueTransaction()
        public
    {
    }
}