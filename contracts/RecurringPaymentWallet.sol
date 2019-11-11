pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/PaymentSchedule.sol";


contract RecurringPaymentWallet {
    PaymentSchedule public paymentSchedule;
    bytes32[] public paymentSchedules;
    address public owner = msg.sender;

    constructor(PaymentSchedule _paymentSchedule)
        public
    {
        paymentSchedule = _paymentSchedule;
    }

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
        address payable destination)
        external
        onlyBy(owner)
        returns(bytes32)
    {
        bytes32 _id = paymentSchedule.createPaymentSchedule(
            subscriptionAmmount,
            paymentLeeway,
            firstPaymentYear,
            firstPaymentMonth,
            firstPaymentDay,
            address(this),
            destination);

        paymentSchedules.push(_id);
        return _id;
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

        bytes32 _scheduleId = paymentSchedules[position];
        require(paymentSchedule.owner(_scheduleId) == address(this), "Can only fund payment schedules owned by this wallet");

        //if isDue create + fund payment
        if (paymentSchedule.isNextPaymentDue(_scheduleId)) {
            paymentSchedule.createNextPayment.value(paymentSchedule.subscriptionAmmount(_scheduleId))(_scheduleId);
        }
    }
}