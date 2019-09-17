pragma solidity ^0.5.0;

import "./lib/ERC20.sol";
import "./RequestableERC20.sol";

/**
 * @title   RequestableERC20Wrapper
 * @notice  RequestableERC20Wrapper is a requestable token contract that can exchange
 *          another base ERC20 token.
 */
contract RequestableERC20Wrapper is RequestableERC20(false) {
  ERC20 public token;

  // Events
  event Depositted(address _from, uint _value);
  event Withdrawn(address _from, uint _value);

  constructor(ERC20 _token) public {
    token = _token;
  }

  function deposit(uint _amount) external isInitialized returns (bool) {
    _mint(msg.sender, _amount);
    emit Depositted(msg.sender, _amount);
    require(token.transferFrom(msg.sender, address(this), _amount));

    return true;
  }

  function withdraw(uint _amount) external isInitialized returns (bool) {
    _burn(msg.sender, _amount);
    emit Withdrawn(msg.sender, _amount);
    require(token.transfer(msg.sender, _amount));

    return true;
  }

}
