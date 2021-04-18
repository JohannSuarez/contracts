/* eslint-env mocha */
/* global artifacts, contract, web3, it, beforeEach */
const chai = require('chai')
const { assert } = chai
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const { expectRevert } = require('@openzeppelin/test-helpers');
const Template = artifacts.require('ERC721Template')
const DTFactory = artifacts.require('ERC721Factory')
const Token = artifacts.require('ERC721Template')
const Metadata = artifacts.require('Metadata')
const testUtils = require('../../helpers/utils')
const truffleAssert = require('truffle-assertions')
const BigNumber = require('bn.js')
const constants = require('../../helpers/constants')
//const console = require('node:console')

contract('ERC721Template', (accounts) => {
    let  name,
        symbol,
        factory,
        metadata,
        template,
        token,
        tokenAddress,
        minter,
        reciever,
        blob
        
    const communityFeeCollector = '0xeE9300b7961e0a01d9f0adb863C7A227A07AaD75'
    beforeEach('init contracts for each test', async () => {
       // blob = 'https://example.com/dataset-1'
       // decimals = 18
        admin = accounts[0]
        reciever = accounts[1]
        user2 = accounts[2]
       // cap = new BigNumber('1400000000')
        blob = web3.utils.asciiToHex(
            constants.blob[0]
        )
        metadata = await Metadata.new()
        console.log(metadata.address)
        template = await Template.new('Template', 'TEMPLATE', admin, blob, blob, metadata.address)
        factory = await DTFactory.new(
            template.address,
            communityFeeCollector
        )
       // blob = 'https://example.com/dataset-1'

        const trxReceipt = await factory.createERC721Token('DT1','DTSYMBOL',admin,metadata.address)
        const TokenCreatedEventArgs = testUtils.getEventArgsFromTx(trxReceipt, 'TokenCreated')
        tokenAddress = TokenCreatedEventArgs.newTokenAddress
        token = await Token.at(tokenAddress)
        symbol = await token.symbol()
        name = await token.name()
        assert(name === 'DT1')
        assert(symbol === 'DTSYMBOL')
      
    })

    it('should check that the token contract is initialized', async () => {
   
     
        assert(
            await token.isInitialized() == true,
            'not initialized'
        )
    })

    it('should fail to re-initialize the contracts', async () => {
        truffleAssert.fails(token.initialize(admin,'NewName', 'NN',metadata.address),
            truffleAssert.ErrorType.REVERT,
            'ERC721Template: token instance already initialized')
    })

    it('should mint 1 ERC721 to admin', async () => {
       
        let totalSupply = await token.totalSupply()
        assert(totalSupply == 0)
        await token.mint(admin,1,{from: admin})
        
        totalSupply = await token.totalSupply()
        assert(totalSupply == 1)

        assert(await token.balanceOf(admin) == 1)

        await expectRevert(token.mint(admin,1,{from: admin}),'ERC721: token already minted')
    })

    it('should revert if caller is not MINTER', async () => {
        await expectRevert(token.mint(admin,2,{from: user2}),'NOT MINTER_ROLE')
    })

    // it('should get the token name', async () => {
    //     const tokenName = await token.name()
    //     assert(tokenName === name)
    // })

    // it('should get the token symbol', async () => {
    //     const tokenSymbol = await token.symbol()
    //     assert(tokenSymbol === symbol)
    // })

    it('should update the metadata', async () => {
        await token.update(blob,blob)
      //  assert(tokenDecimals.toNumber() === decimals)
    })

   
})
