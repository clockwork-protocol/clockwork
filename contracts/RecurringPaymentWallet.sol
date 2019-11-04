pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/PaymentSchedule.sol";


contract RecurringPaymentWallet {
    PaymentSchedule[] public paymentSchedules;
    address public owner = msg.sender;

    modifier onlyBy(address account)
    {
        require(
            msg.sender == account,
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

    function withdraw(uint amount)
        external
        onlyBy(owner)
    {
        require(amount <= address(this).balance, "Withdrawal request exceeds balance");
        msg.sender.transfer(amount);
    }

    function createPaymentSchedule(
        uint subscriptionAmmount,
        uint paymentLeeway,
        uint firstPaymentYear,
        uint firstPaymentMonth,
        uint firstPaymentDay,
        address payable destination,
        Payment payment)
        external
        onlyBy(owner)
        returns(PaymentSchedule)
    {
        PaymentSchedule paymentSchedule = new PaymentSchedule(
            subscriptionAmmount,
            paymentLeeway,
            firstPaymentYear,
            firstPaymentMonth,
            firstPaymentDay,
            address(this),
            destination,
            payment);
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
        if (ps.isNextPaymentDue()) {
            ps.createNextPayment.value(ps.subscriptionAmmount())();
        }
    }

    function generateDueTransaction()
        external
    {
    }
}