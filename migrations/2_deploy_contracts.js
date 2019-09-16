const RequestableERC20 = artifacts.require('./RequestableERC20.sol');

const development = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

module.exports = function (deployer) {
    deployer.deploy(RequestableERC20, development);
    return;
};
