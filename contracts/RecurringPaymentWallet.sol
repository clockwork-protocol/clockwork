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

    function deposit()
        public
        payable
    {
    }

    //only owner
    function withdraw()
        public
    {
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