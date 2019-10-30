pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/PaymentSchedule.sol";

contract RecurringPaymentWallet {
    uint public balance = 0;
    PaymentSchedule[] public paymentSchedules;
    address public owner = msg.sender;

    event DuePaymentCreated(Payment duePayment);

    modifier onlyBy(address _account)
    {
        require(
            msg.sender == _account,
            "Sender not authorized."
        );
        _; //function body
    }

    function getBalance()
        external
        view
        returns(uint)
    {
        return address(this).balance;
    }

    function deposit()
        external
        payable
    {
        require(msg.value > 0, "Message value must be greater than zero");
    }

    //only owner
    function withdraw(uint _amount)
        external
        onlyBy(owner)
    {
        require(_amount <= address(this).balance, "Withdrawal request exceeds balance");
        msg.sender.transfer(_amount);
    }

    function createPaymentSchedule(
            uint _subscriptionAmmount,
            uint _paymentLeeway,
            uint _firstPaymentYear,
            uint _firstPaymentMonth,
            uint _firstPaymentDay,
            address payable _destination)
        external
        onlyBy(owner)
        returns(PaymentSchedule)
    {
        PaymentSchedule paymentSchedule = new PaymentSchedule(
            _subscriptionAmmount,
            _paymentLeeway,
            _firstPaymentYear,
            _firstPaymentMonth,
            _firstPaymentDay,
            address(this),
            _destination);
        paymentSchedules.push(paymentSchedule);
        return paymentSchedule;
    }

    function paymentScheduleCount()
        external
        view
        returns(uint)
    {
        return paymentSchedules.length;
    }

    function createAndFundDuePaymentForPaymentSchedule(uint position)
        external
        returns(bool)
    {
        require((position < paymentSchedules.length) && (position >= 0), "Position out of range");

        PaymentSchedule ps = paymentSchedules[position];
        require(ps.owner() == address(this), "Can only fund payment schedules owned by this wallet");

        //if isDue create + fund payment
        if (ps.isNextPaymentDue()){
            ps.createNextPayment.value(ps.subscriptionAmmount())();
            //emit due payment
            emit DuePaymentCreated(ps.latestPayment());
        }
    }

    function generateDueTransaction()
        external
    {
    }
}