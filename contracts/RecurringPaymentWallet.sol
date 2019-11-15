pragma solidity ^0.5.0;
import "contracts/Payment.sol";
import "contracts/PaymentSchedule.sol";

// todo::
// test drain method
// if not enough funds to fund payment emit event
// when wallet is funded emit event + test
// when withdrawn emit event + test


contract RecurringPaymentWallet {
    struct WalletDetails {
        uint balance;
        address owner;
        bytes32[] paymentSchedules;
    }

    PaymentSchedule private paymentSchedule;
    mapping(address => WalletDetails) public wallets;

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

    modifier withdrawalAllowed(address account, uint amount)
    {
        WalletDetails storage _walletDetails = wallets[account];
        require(amount <= _walletDetails.balance, "Withdrawal request exceeds wallet balance");
        require(account == _walletDetails.owner, "Only owner can withdraw from wallet");
        _; //function body
    }

    function getBalance()
        external
        view
        returns(uint)
    {
        WalletDetails storage _walletDetails = wallets[msg.sender];
        return _walletDetails.balance;
    }

    function deposit()
        external
        payable
    {
        require(msg.value > 0, "Message value must be greater than zero");

        //retrieve senders wallet
        WalletDetails storage _walletDetails = wallets[msg.sender];
        setWalletOwner(_walletDetails, msg.sender);

        _walletDetails.balance += msg.value;

        assert(msg.sender == _walletDetails.owner);
    }

    function withdraw(uint amount)
        external
        withdrawalAllowed(msg.sender, amount)
    {
        WalletDetails storage _walletDetails = wallets[msg.sender];
        _walletDetails.balance -= amount;
        assert(_walletDetails.balance >= 0);

        msg.sender.transfer(amount);
    }

    function drain()
        external
        withdrawalAllowed(msg.sender, wallets[msg.sender].balance)
    {
        WalletDetails storage _walletDetails = wallets[msg.sender];
        _walletDetails.balance -= _walletDetails.balance;
        assert(_walletDetails.balance >= 0);

        msg.sender.transfer(_walletDetails.balance);
    }

    function createPaymentSchedule(
        uint subscriptionAmmount,
        uint paymentLeeway,
        uint firstPaymentYear,
        uint firstPaymentMonth,
        uint firstPaymentDay,
        address payable destination)
        external
        returns(bytes32)
    {
        WalletDetails storage _walletDetails = wallets[msg.sender];

        bytes32 _id = paymentSchedule.createPaymentSchedule(
            subscriptionAmmount,
            paymentLeeway,
            firstPaymentYear,
            firstPaymentMonth,
            firstPaymentDay,
            address(this),
            destination);

        setWalletOwner(_walletDetails, msg.sender);

        _walletDetails.paymentSchedules.push(_id);
        return _id;
    }

    function paymentScheduleCount()
        external
        view
        returns(uint)
    {
        return wallets[msg.sender].paymentSchedules.length;
    }

    function paymentSchedules(uint _index)
        external
        view
        returns(bytes32)
    {
        return wallets[msg.sender].paymentSchedules[_index];
    }

    function createAndFundDuePaymentForPaymentSchedule(address _owner, uint _schedulePosition)
        external
        returns(bool)
    {
        WalletDetails storage _walletDetails = wallets[_owner];
        require((_schedulePosition < _walletDetails.paymentSchedules.length) && (_schedulePosition >= 0), "Position out of range");

        bytes32 _scheduleId = _walletDetails.paymentSchedules[_schedulePosition];
        //todo : do we need to do the below check?
        //require(paymentSchedule.owner(_scheduleId) == _walletDetails.owner, "Can only fund payment schedules owned by this wallet");

        //if isDue create + fund payment
        if (paymentSchedule.isNextPaymentDue(_scheduleId)) {
            //todo if not enough funds to fund payment emit event
            paymentSchedule.createNextPayment.value(paymentSchedule.subscriptionAmmount(_scheduleId))(_scheduleId);
        }
    }

    function setWalletOwner(WalletDetails storage _walletDetails, address _sender)
        internal
    {
        if (_walletDetails.owner == address(0)) {
            _walletDetails.owner = _sender;
        }
    }
}