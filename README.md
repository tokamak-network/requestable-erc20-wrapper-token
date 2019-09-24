# RequestableERC20WrapperToken

Requestable ERC20 Wrapper Token is a wrapper contract for ERC20 token with the capability of being requestable to Plasma EVM. Also, standalone requestable ERC20 token contracts are privided.

## Contracts
- [RequestableERC20](./contracts/RequestableERC20.sol)
- [RequestableERC20Wrapper](./contracts/RequestableERC20Wrapper.sol)
- [RequestableERC20Mintable](./contracts/RequestableERC20Mintable.sol)
- [RequestableERC20Burnable](./contracts/RequestableERC20Burnable.sol)
- [RequestableERC20MintableBurnable](./contracts/RequestableERC20MintableBurnable.sol)

## Deploy
npm script `npm run deploy:*` helps you choose what contract you want.

You can also add truffle arguments at the end of script after ` -- `, like `npm run deploy -- --network plasma`.

### Examples
```bash
# 1. deploy RequestableERC20Wrapper
$ TOKEN=0x5251336Bd7e7D3Eba15F422436f76BECfB0c84E8 npm run deploy

# 2. deploy RequestableERC20MintableMock
$ npm run deploy:mintable

# 3. deploy RequestableERC20BurnableMock
$ npm run deploy:burnable

# 4. deploy RequestableERC20MintableBurnableMock
$ npm run deploy:mintable:burnable
```

### Environment Variables

#### Decription

| env               | description                                                                                                                                                                  |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| DEVELOPMENT       | development flag. Do not set in production                                                                                                                                   |
| LOCK_IN_ROOTCHAIN | If true, for enter request, holds requestor's token in root chain, for exit request, transfer the tokens from this contract. If false, just mint and burn requestor's token. |
| INITIAL_SUPPLY    | the amount of tokens to deployer                                                                                                                                             |
| TOKEN             | base token contract address for RequestableERC20Wrapper                                                                                                                      |
| MINTABLE          | deploy mintable (DO NOT DIRECTLY USE THIS, USE NPM SCRIPT INSTEAD)                                                                                                           |
| BURNABLE          | deploy burnable (DO NOT DIRECTLY USE THIS, USE NPM SCRIPT INSTEAD)                                                                                                           |

If both `MINTABLE` and `BURNABLE` are set, truffle will deploy ERC20MintableBurnable. See more [deploy script](./migrations/2_deploy_contracts.js).

#### Usages

Prefix `Requestable` in contract name is omitted for briefness.


| env               | ERC20 | ERC20Wrapper | ERC20Mintable | ERC20Burnable | ERC20MintableBurnable |
|-------------------|-------|--------------|---------------|---------------|-----------------------|
| DEVELOPMENT       | o     | o            | o             | o             | o                     |
| LOCK_IN_ROOTCHAIN | o     | o            | o             | o             | o                     |
| INITIAL_SUPPLY    | o     |              |               | o             |                       |
| TOKEN             |       | o            |               |               |                       |
| MINTABLE          |       |              | o             |               | o                     |
| BURNABLE          |       |              |               | o             | o                     |

## Make a Request

Before making request, [`RootChain`](https://github.com/Onther-Tech/plasma-evm-contracts) contract must be set in `RequestableERC20*` contract. To do this, use `RequestableERC20.init(address rootchain)`.

### Requestable Variables
> `isNew` is 1 for true, 0 for false.

| Requestable Variables                | trieKey                                                                    | trieValue                      |
|--------------------------------------|----------------------------------------------------------------------------|--------------------------------|
| `ERC20.allownace[owner][requestor]`  | [`RequestableERC20.KEY_ALLOWANCE`](./contracts/RequestableERC20.sol#L35)       | `RLP.encode([owner, amount])`  |
| `ERC20.balances[requestor]`          | [`RequestableERC20.KEY_BALANCES`](./contracts/RequestableERC20.sol#L38)        | `RLP.encode(amount)`           |
| `RequestableERC20Mintable.minters[]` | [`RequestableERC20Mintable.KEY_MINTERS`](./contracts/RequestableERC20Mintable.sol#L18) | `RLP.encode([minter, isNew])`  |
| `RequestableERC20Burnable.burners[]` | [`RequestableERC20Burnable.KEY_BURNERS`](./contracts/RequestableERC20Burnable.sol#L23) | `RLP.encode([burner, isNew])` |