/* eslint-env mocha */
/* global artifacts, contract, web3, it, beforeEach */
const chai = require('chai')
const { assert } = chai
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const { expectRevert } = require('@openzeppelin/test-helpers');
const { ethers } = require("ethers");
const ERC721Template = artifacts.require('ERC721Template')
const ERC20Template = artifacts.require('ERC20Template')
const ERC721Factory = artifacts.require('ERC721Factory')
const ERC20Factory = artifacts.require('ERC20Factory')
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
        //console.log(metadata.address)
       
        templateERC20 = await ERC20Template.new('TemplateERC20','TEMPLATE20',user2,web3.utils.toWei('22'),blob,communityFeeCollector)
        factoryERC20 = await ERC20Factory.new(templateERC20.address,communityFeeCollector)
        templateERC721 = await ERC721Template.new('TemplateERC721', 'TEMPLATE721', admin, metadata.address,factoryERC20.address,blob, blob,)
        factoryERC721 = await ERC721Factory.new(
            templateERC721.address,
            communityFeeCollector,
            factoryERC20.address
        )
       // blob = 'https://example.com/dataset-1'

        const trxReceipt = await factoryERC721.createERC721Token('DT1','DTSYMBOL',admin,metadata.address,blob, blob)
        const TokenCreatedEventArgs = testUtils.getEventArgsFromTx(trxReceipt, 'TokenCreated')
        tokenAddress = TokenCreatedEventArgs.newTokenAddress
        token = await ERC721Template.at(tokenAddress)
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
        truffleAssert.fails(token.initialize(admin,'NewName', 'NN',metadata.address,factoryERC20.address,blob, blob),
            truffleAssert.ErrorType.REVERT,
            'ERC721Template: token instance already initialized')
    })

    it('should mint 1 ERC721 to admin', async () => {
       
        let totalSupply = await token.totalSupply()
        assert(totalSupply == 0)
        await token.mint(admin,{from: admin})
        
        totalSupply = await token.totalSupply()
        assert(totalSupply == 1)

        assert(await token.balanceOf(admin) == 1)

        //await expectRevert(token.mint(admin,{from: admin}),'ERC721: token already minted')
    })

    it('should revert if caller is not MINTER', async () => {
        await expectRevert(token.mint(admin,{from: user2}),'NOT MINTER_ROLE')
    })

    it('should update the metadata', async () => {
        await token.update(blob,blob,{from:admin})
      
    })

    it('should not be allowed to update the metadata if not METADATA_ROLE', async () => {
        await expectRevert(token.update(blob,blob,{from:user2}),'NOT METADATA_ROLE')
      
    })

    it('should create a new ERC20Token', async () => {
        await token.createERC20(blob,'ERC20DT1','ERC20DT1Symbol',web3.utils.toWei('10'), {from:admin})
    
        await expectRevert(token.createERC20(blob,'ERC20DT1','ERC20DT1Symbol',web3.utils.toWei('10'), {from:admin}),'ERC20 Already Created')
    })

    it('should not allowed to create a new ERC20Token if NOT Minter ROLE in ERC721Contract', async () => {
   
     await expectRevert(token.createERC20(blob,'ERC20DT1','ERC20DT1Symbol',web3.utils.toWei('10'), {from:user2}),'NOT MINTER_ROLE')
    })

    it('should not allowed to create a new ERC20Token directly from the ERC20Factory', async () => {
        //   await token.createERC20(blob,'ERC20DT1','ERC20DT1Symbol',web3.utils.toWei('10'), {from:admin})
         //  assert(tokenDecimals.toNumber() === decimals)
        
        await expectRevert.unspecified(factoryERC20.createToken(blob,'ERC20DT1','ERC20DT1Symbol',web3.utils.toWei('10'),token.address, {from:user2}))
       })

   
})
