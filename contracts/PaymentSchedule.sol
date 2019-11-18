pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/lib/BokkyPooBahsDateTimeLibrary.sol";

// Todo
// test events and thier values PaymentScheduleCreated, NextPaymentDateSet


contract PaymentSchedule {

    struct PaymentScheduleDetails {
        bytes32 id;
        uint nextPaymentDate;
        uint paymentLeeway;
        address owner;
        address payable destination;
        uint subscriptionAmmount;
        bytes32 latestPaymentId;
    }

    event PaymentScheduleCreated(
        bytes32 id,
        uint paymentLeeway,
        address owner,
        address destination,
        uint subscriptionAmmount
    );

    event NextPaymentDateSet(bytes32 id, uint nextPaymentDate);

    mapping(bytes32 => PaymentScheduleDetails) public details;
    Payment private payment;

    constructor(Payment _payment)
        public
    {
        payment = _payment;
    }

    function createPaymentSchedule(
        uint _subscriptionAmmount,
        uint _paymentLeeway,
        uint _firstPaymentYear,
        uint _firstPaymentMonth,
        uint _firstPaymentDay,
        address _owner,
        address payable _destination)
        external
        returns(bytes32)
    {
        require(BokkyPooBahsDateTimeLibrary.isValidDate(_firstPaymentYear, _firstPaymentMonth, _firstPaymentDay), "Invalid first payment date");
        require(_paymentLeeway >= 1, "Payment leeway must be more than or equal to one day");

        //Generate ID
        //is it ok to use block.timeStamp here or should we use a random number generator?
        bytes32 _scheduleId = keccak256(
            abi.encodePacked(
                _subscriptionAmmount,
                _firstPaymentYear,
                _firstPaymentMonth,
                _firstPaymentDay,
                _owner,
                _destination,
                block.timestamp
            )
        );

        details[_scheduleId].id = _scheduleId;
        details[_scheduleId].nextPaymentDate = BokkyPooBahsDateTimeLibrary.timestampFromDate(
            _firstPaymentYear,
            _firstPaymentMonth,
            _firstPaymentDay);
        details[_scheduleId].owner = _owner;
        details[_scheduleId].destination = _destination;
        details[_scheduleId].subscriptionAmmount = _subscriptionAmmount;
        details[_scheduleId].paymentLeeway = _paymentLeeway;

        emit PaymentScheduleCreated(
            _scheduleId,
            _paymentLeeway,
            _owner,
            _destination,
            _subscriptionAmmount
        );

        emit NextPaymentDateSet(
            _scheduleId,
            details[_scheduleId].nextPaymentDate
        );

        return _scheduleId;
    }

    function owner(bytes32 _scheduleId)
        external
        view
        returns(address)
    {
        return details[_scheduleId].owner;
    }

    function subscriptionAmmount(bytes32 _scheduleId)
        external
        view
        returns(uint)
    {
        return details[_scheduleId].subscriptionAmmount;
    }

    function destination(bytes32 _scheduleId)
        external
        view
        returns(address)
    {
        return details[_scheduleId].destination;
    }

    function latestPaymentId(bytes32 _scheduleId)
        external
        view
        returns(bytes32)
    {
        return details[_scheduleId].latestPaymentId;
    }

    function createNextPayment(bytes32 _scheduleId)
        external
        payable
    {
        require(isNextPaymentDue(_scheduleId), "PaymentSchedule must be due to create a payment");
        require(payment.isExecuted(details[_scheduleId].latestPaymentId), "Can only create a new payment if last payment has been made");
        require(msg.value >= details[_scheduleId].subscriptionAmmount, "Insufficient funds to fund payment");

        details[_scheduleId].latestPaymentId = payment.createPayment.value(details[_scheduleId].subscriptionAmmount)
            (details[_scheduleId].destination,
            details[_scheduleId].subscriptionAmmount,
            overdueDate(_scheduleId));

        details[_scheduleId].nextPaymentDate = BokkyPooBahsDateTimeLibrary.addMonths(details[_scheduleId].nextPaymentDate, 1);
    }

    function isOverDue(bytes32 _scheduleId)
        external
        view
        returns(bool)
    {
        bool isSubscriptionOverdue = block.timestamp > overdueDate(_scheduleId);
        bool isLatestPaymentOverdue = payment.isOverdue(details[_scheduleId].latestPaymentId);
        return isSubscriptionOverdue || isLatestPaymentOverdue;
    }

    function isNextPaymentDue(bytes32 _scheduleId)
        public
        view
        returns(bool)
    {
        return block.timestamp > details[_scheduleId].nextPaymentDate;
    }

    function overdueDate(bytes32 _scheduleId)
        private
        view
        returns(uint)
    {
        return BokkyPooBahsDateTimeLibrary.addDays(details[_scheduleId].nextPaymentDate, details[_scheduleId].paymentLeeway);
    }
}