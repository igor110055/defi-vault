const { ethers } = require("hardhat")
const { expect } = require("chai")
const BigNumber = require('bignumber.js')
const { time } = require("./utilities")

describe("StrikeBoostFarm", function() {
  before(async function() {
    this.signers = await ethers.getSigners()
    this.annOwner = this.signers[0]
    this.alice = this.signers[1]
    this.bob = this.signers[2]
    this.carol = this.signers[3]
    this.dev = this.signers[4]
    this.minter = this.signers[5]
    this.vaulter = this.signers[6]
    this.nftOwner = this.signers[7]

    this.AnnexBoostFarm = await ethers.getContractFactory("StrikeBoostFarm")
    this.BoostToken = await ethers.getContractFactory("AnnexIronWolf")
    this.ANNToken = await ethers.getContractFactory("ANN")
    this.VannToken = await ethers.getContractFactory("VANNToken")
    this.ERC20Mock = await ethers.getContractFactory("ERC20Mock", this.minter)
  })

  beforeEach(async function() {
    this.annex = await this.ANNToken.deploy(this.annOwner.address)
    await this.annex.deployed()
    this.boostToken = await this.BoostToken.deploy(
      "AnnexIronWolf",
      "AIW",
      "https://nftassets.annex.finance/ipfs/QmZ5RMDdHHy8Da2Td43mHF32bDXnY51Ui68PnFFQdDaV9U",
      this.nftOwner.address
    )
    await this.boostToken.deployed()
    this.rewardToken = await this.ERC20Mock.deploy("Reward Token", "BUSD", "10000000000")
    await this.rewardToken.deployed()
    this.vAnn = await this.VannToken.deploy("VANN Token", "VANN")
    this.vAnn.deployed();
  })

  it("should set correct state variables", async function() {
    this.chef = await this.AnnexBoostFarm.deploy(
      this.annex.address,
      this.rewardToken.address,
      this.vAnn.address,
      this.boostToken.address,
      "100",
      "0",
      "0"
    )
    await this.chef.deployed()

    const annex = await this.chef.annex()
    const boostToken = await this.chef.boostFactor()
    const owner = await this.annex.owner()

    expect(annex).to.equal(this.annex.address)
    expect(boostToken).to.equal(this.boostToken.address)
    expect(owner).to.equal(this.annOwner.address)
  })

  context("With ERC/LP token added to the field", function() {
    beforeEach(async function() {
      await this.annex.transfer(this.alice.address, "1000")

      await this.annex.transfer(this.bob.address, "1000")

      await this.annex.transfer(this.carol.address, "1000")

      await this.annex.transfer(this.vaulter.address, "1000")
    })

    // it("should allow emergency withdraw", async function() {
    //   // 100 per block farming rate starting at block 100 with bonus until block 1000
    //   this.chef = await this.AnnexBoostFarm.deploy(
    //     this.annex.address,
    //     this.rewardToken.address,
    //     this.boostToken.address,
    //     "100",
    //     "100",
    //     "100"
    //   )
    //   await this.chef.deployed()

    //   await this.chef.add("100", this.annex.address, true)

    //   await this.annex.connect(this.bob).approve(this.chef.address, "1000", { from: this.bob.address })

    //   await this.chef.connect(this.bob).deposit(0, "100", { from: this.bob.address })

    //   expect(await this.annex.balanceOf(this.bob.address)).to.equal("900")

    //   await this.chef.connect(this.bob).emergencyWithdraw(0, { from: this.bob.address })

    //   expect(await this.annex.balanceOf(this.bob.address)).to.equal("1000")
    // })

    // it("should give out Rewards only after farming time, boosted with nft", async function() {
    //   // 100 per block farming rate starting at block 100 with bonus until block 1000
    //   this.chef = await this.AnnexBoostFarm.deploy(
    //     this.annex.address,
    //     this.rewardToken.address,
    //     this.vAnn.address,
    //     this.boostToken.address,
    //     "100",
    //     "100",
    //     "100"
    //   )
    //   await this.chef.deployed()

    //   this.rewardToken.transfer(this.chef.address, "10000")
    //   this.vAnn.transferOwnership(this.chef.address, true, false)

    //   await this.chef.add("100", this.annex.address, true)
    //   expect(await this.chef.totalAllocPoint()).to.equal("100")

    //   await this.annex.connect(this.bob).approve(this.chef.address, "1000", { from: this.bob.address })
    //   await this.chef.connect(this.bob).deposit(0, 100, { from: this.bob.address })
    //   expect(await this.vAnn.balanceOf(this.bob.address)).to.equal("1000")
    //   await time.advanceBlockTo("89")
    //   await this.chef.connect(this.bob).deposit(0, 0, { from: this.bob.address }) // block 90
    //   expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("0")
    //   await time.advanceBlockTo("94")

    //   await this.chef.connect(this.bob).deposit(0, 0, { from: this.bob.address }) // block 95
    //   expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("0")
    //   await time.advanceBlockTo("99")

    //   // just started reward from 100th block
    //   await this.chef.connect(this.bob).deposit(0, 0, { from: this.bob.address }) // block 100
    //   expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("0")

    //   // won't be got the reward because didn't stake AIW nft
    //   await this.chef.connect(this.bob).deposit(0, 0, { from: this.bob.address }) // block 101
    //   expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("0")

    //   await this.boostToken.gift(1, this.bob.address) //block 102
    //   await this.boostToken.setStakingAddress(this.chef.address)  //block 103
    //   await this.chef.updateClaimBaseRewardTime(0)  //block 104
    //   await this.chef.updateUnstakableTime(1)  //block 105
    //   await this.boostToken.connect(this.bob).setApprovalForAll(this.chef.address, true, { from: this.bob.address }) // block 106
    //   await this.chef.connect(this.bob).boost(0, 1, { from: this.bob.address }) // block 107
    //   await time.advanceBlockTo("116")
    //   await this.chef.connect(this.bob).deposit(0, 0, { from: this.bob.address }) // block 117
    //   expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("1000")
    //   expect(await this.boostToken.balanceOf(this.bob.address)).to.equal("0")
    //   expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("1000")
    // })

    it("should receive rewards with 1m LP token deposit", async function() {
      this.chef = await this.AnnexBoostFarm.deploy(
        this.annex.address,
        this.rewardToken.address,
        this.vAnn.address,
        this.boostToken.address,
        "100",
        "100",
        "0"
      )
      await this.chef.deployed()

      await this.annex.transfer(this.bob.address, "999000")
      this.rewardToken.transfer(this.chef.address, "10000")
      this.vAnn.transferOwnership(this.chef.address, true, false)
      await this.boostToken.setStakingAddress(this.chef.address)
      await this.chef.updateClaimBaseRewardTime(0)
      await this.chef.updateUnstakableTime(1)
      await this.chef.updateClaimBoostRewardTime(0)
      
      await this.chef.setAccMulFactor("1000000000000");
      await this.chef.add("100", this.annex.address, true)
      await this.annex.connect(this.bob).approve(this.chef.address, "1000000", { from: this.bob.address })
      await time.advanceBlockTo("99")
      expect(await this.rewardToken.balanceOf(this.chef.address)).to.equal("10000")
      await time.advanceBlockTo("104")
      expect(await this.rewardToken.balanceOf(this.chef.address)).to.equal("10000")
      await time.advanceBlockTo("109")
      await this.chef.connect(this.bob).deposit(0, "1000000", { from: this.bob.address }) // block 210
      expect(await this.rewardToken.balanceOf(this.chef.address)).to.equal("10000")
      expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("0")
      await this.chef.updateUnstakableTime(1)
      await time.advanceBlockTo("119")
      await this.vAnn.connect(this.bob).approve(this.chef.address, "100000000000000000", { from: this.bob.address })
      
      await this.boostToken.gift(15, this.bob.address) // block 321
      await this.boostToken.connect(this.bob).setApprovalForAll(this.chef.address, true, { from: this.bob.address }) // block 324
      await this.chef.connect(this.bob).boost(0, 1, { from: this.bob.address }) // block 331
      expect(await this.chef.pendingBaseReward(0, this.bob.address)).to.equal("0")
      await this.chef.connect(this.bob).deposit(0, 0, { from: this.bob.address }) // block 332
      expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("100")

      await this.chef.connect(this.bob).deposit(0, 0, { from: this.bob.address }) // block 332
      expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("200")
      await time.advanceBlockTo("129")
      expect(await this.chef.pendingBaseReward(0, this.bob.address)).to.equal("400")
      await this.chef.connect(this.bob).deposit(0, 0, { from: this.bob.address }) // block 332
      expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("700")
      await time.advanceBlockTo("139")
      expect(await this.chef.pendingBaseReward(0, this.bob.address)).to.equal("900")

    })

    it("should not distribute ANNs if no one deposit and can't withdraw until unstakableTime", async function() {
      this.chef = await this.AnnexBoostFarm.deploy(
        this.annex.address,
        this.rewardToken.address,
        this.vAnn.address,
        this.boostToken.address,
        "100",
        "100",
        "0"
      )
      await this.chef.deployed()

      this.rewardToken.transfer(this.chef.address, "10000")
      this.vAnn.transferOwnership(this.chef.address, true, false)
      await this.boostToken.setStakingAddress(this.chef.address)

      await this.chef.add("100", this.annex.address, true)
      await this.annex.connect(this.bob).approve(this.chef.address, "1000", { from: this.bob.address })
      await time.advanceBlockTo("199")
      expect(await this.rewardToken.balanceOf(this.chef.address)).to.equal("10000")
      await time.advanceBlockTo("204")
      expect(await this.rewardToken.balanceOf(this.chef.address)).to.equal("10000")
      await time.advanceBlockTo("209")
      await this.chef.connect(this.bob).deposit(0, "100", { from: this.bob.address }) // block 210
      expect(await this.rewardToken.balanceOf(this.chef.address)).to.equal("10000")
      expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("0")
      await this.chef.updateUnstakableTime(1)
      await time.advanceBlockTo("219")
      await this.vAnn.connect(this.bob).approve(this.chef.address, "100000000000000000", { from: this.bob.address })
      await this.chef.connect(this.bob).withdraw(0, "100", { from: this.bob.address }) // block 220
      expect(await this.vAnn.balanceOf(this.bob.address)).to.equal("0")
      expect(await this.rewardToken.balanceOf(this.chef.address)).to.equal("10000")
      expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("0")
      expect(await this.annex.balanceOf(this.bob.address)).to.equal("1000")
    })

    it("should distribute ANNs properly for each staker", async function() {
      this.chef = await this.AnnexBoostFarm.deploy(
        this.annex.address,
        this.rewardToken.address,
        this.vAnn.address,
        this.boostToken.address,
        "100",
        "100",
        "0"
      )
      await this.chef.deployed()

      this.rewardToken.transfer(this.chef.address, "10000")
      this.vAnn.transferOwnership(this.chef.address, true, false)
      await this.boostToken.setStakingAddress(this.chef.address)
      await this.chef.updateClaimBaseRewardTime(0)
      await this.chef.updateUnstakableTime(1)
      await this.chef.updateClaimBoostRewardTime(0)

      await this.chef.add("100", this.annex.address, true)
      await this.annex.connect(this.alice).approve(this.chef.address, "1000", {
        from: this.alice.address,
      })
      await this.annex.connect(this.bob).approve(this.chef.address, "1000", {
        from: this.bob.address,
      })
      await this.annex.connect(this.carol).approve(this.chef.address, "1000", {
        from: this.carol.address,
      })
      // Alice deposits 10 LPs at block 310
      await time.advanceBlockTo("309")
      await this.chef.connect(this.alice).deposit(0, "10", { from: this.alice.address })
      // Bob deposits 20 LPs at block 314
      await time.advanceBlockTo("313")
      await this.chef.connect(this.bob).deposit(0, "20", { from: this.bob.address })
      // Carol deposits 30 LPs at block 318
      await time.advanceBlockTo("317")
      await this.chef.connect(this.carol).deposit(0, "40", { from: this.carol.address })
      // Alice deposits 10 more LPs at block 320. At this point:
      // Alice should have: 4*1000 + 4*1/3*1000 + 2*1/6*1000 = 5666
      // AnnexBoostFarm should have the remaining: 10000 - 5666 = 4334
      await time.advanceBlockTo("319")
      await this.chef.connect(this.alice).deposit(0, "10", { from: this.alice.address }) // block 320
      expect(await this.annex.balanceOf(this.chef.address)).to.equal("80")
      expect(await this.annex.balanceOf(this.alice.address)).to.equal("980")
      expect(await this.annex.balanceOf(this.bob.address)).to.equal("980")
      expect(await this.annex.balanceOf(this.carol.address)).to.equal("960")
      expect(await this.rewardToken.balanceOf(this.chef.address)).to.equal("10000")

      await this.boostToken.gift(15, this.bob.address) // block 321
      await this.boostToken.gift(15, this.alice.address) // block 322
      await this.boostToken.gift(15, this.carol.address) // block 323
      await this.boostToken.connect(this.bob).setApprovalForAll(this.chef.address, true, { from: this.bob.address }) // block 324
      await this.boostToken.connect(this.alice).setApprovalForAll(this.chef.address, true, { from: this.alice.address }) // block 325
      await this.boostToken.connect(this.carol).setApprovalForAll(this.chef.address, true, { from: this.carol.address }) // block 326
      await time.advanceBlockTo("330")
      await this.chef.connect(this.bob).boost(0, 1, { from: this.bob.address }) // block 331
      await this.chef.connect(this.bob).deposit(0, 0, { from: this.bob.address }) // block 332
      expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("100")
      expect(await this.rewardToken.balanceOf(this.alice.address)).to.equal("0")

      await this.chef.connect(this.alice).boost(0, 16, { from: this.alice.address }) // block 333

      await this.chef.connect(this.bob).deposit(0, 0, { from: this.bob.address }) // block 334
      expect(await this.rewardToken.balanceOf(this.bob.address)).to.equal("250")
      
      await this.chef.connect(this.alice).deposit(0, 0, { from: this.alice.address }) // block 335
      expect(await this.rewardToken.balanceOf(this.alice.address)).to.equal("100")

      // bob boost one more nft
      await this.chef.connect(this.bob).boost(0, 2, { from: this.bob.address }) // block 336
      await time.advanceBlockTo("340")
      // boostReward = 50 * 4 * 0.4 = 80
      expect(await this.chef.pendingBaseReward(0, this.bob.address)).to.equal("200")
      expect(await this.chef.pendingBoostReward(0, this.bob.address)).to.equal("80")
      expect(await this.chef.pendingReward(0, this.bob.address)).to.equal("280")

      await this.chef.connect(this.bob).boost(0, 3, { from: this.bob.address }) // block 341
      await time.advanceBlockTo("351")
      // boostReward = 50 * 10 * 0.6 = 300
      expect(await this.chef.pendingBaseReward(0, this.bob.address)).to.equal("500")
      expect(await this.chef.pendingBoostReward(0, this.bob.address)).to.equal("400")
      expect(await this.chef.pendingReward(0, this.bob.address)).to.equal("900")

      await this.chef.connect(this.bob).boostPartially(0, 7, { from: this.bob.address }) // block 352
      await time.advanceBlockTo("362")
      // boostReward = 50 * 10 * 2 = 1000
      expect(await this.chef.pendingBaseReward(0, this.bob.address)).to.equal("500")
      expect(await this.chef.pendingBoostReward(0, this.bob.address)).to.equal("1430")
      expect(await this.chef.pendingReward(0, this.bob.address)).to.equal("1930")

      // alice balance
      await this.chef.connect(this.alice).boostAll(0, [17,18,19,20,21,22,23,24,25,26,27,28,29,30], { from: this.alice.address }) // block 363
      await time.advanceBlockTo("373")
      expect(await this.chef.pendingBaseReward(0, this.alice.address)).to.equal("500")
      expect(await this.chef.pendingBoostReward(0, this.alice.address)).to.equal("1000")
      expect(await this.chef.pendingReward(0, this.alice.address)).to.equal("1500")
      expect(await this.rewardToken.balanceOf(this.alice.address)).to.equal("1500")
      await this.chef.connect(this.alice).claimBoostReward(0);
      expect(await this.chef.pendingBaseReward(0, this.alice.address)).to.equal("0")
      expect(await this.rewardToken.balanceOf(this.alice.address)).to.equal("3150")

      // carol balance
      await this.chef.connect(this.carol).boost(0, 31, { from: this.carol.address }) // block 374
      await time.advanceBlockTo("384")
      expect(await this.chef.pendingBaseReward(0, this.carol.address)).to.equal("450")
      expect(await this.chef.pendingBoostReward(0, this.carol.address)).to.equal("0")
      expect(await this.chef.pendingReward(0, this.carol.address)).to.equal("450")

      expect(await this.chef.pendingBaseReward(0, this.alice.address)).to.equal("275")
      expect(await this.chef.pendingBaseReward(0, this.bob.address)).to.equal("1375")
    })

    it("should give proper ANNs allocation to each pool", async function() {
      this.chef = await this.AnnexBoostFarm.deploy(
        this.annex.address,
        this.rewardToken.address,
        this.vAnn.address,
        this.boostToken.address,
        "100",
        "100",
        "0"
      )
      await this.chef.deployed()

      this.rewardToken.transfer(this.chef.address, "10000")
      this.vAnn.transferOwnership(this.chef.address, true, false)
      await this.boostToken.setStakingAddress(this.chef.address)
      await this.chef.updateClaimBaseRewardTime(0)
      await this.chef.updateUnstakableTime(1)
      await this.chef.updateClaimBoostRewardTime(0)

      await this.chef.add("100", this.annex.address, true)
      await this.annex.connect(this.alice).approve(this.chef.address, "1000", {
        from: this.alice.address,
      })
      await this.annex.connect(this.bob).approve(this.chef.address, "1000", {
        from: this.bob.address,
      })
      await this.annex.connect(this.carol).approve(this.chef.address, "1000", {
        from: this.carol.address,
      })

      await this.boostToken.gift(5, this.bob.address)
      await this.boostToken.gift(10, this.alice.address)
      await this.boostToken.gift(15, this.carol.address)

      // await this.lp.connect(this.alice).approve(this.chef.address, "1000", { from: this.alice.address })
      // await this.lp2.connect(this.bob).approve(this.chef.address, "1000", { from: this.bob.address })
      // // Add first LP to the pool with allocation 1
      // await this.chef.add("10", this.lp.address, true)
      // // Alice deposits 10 LPs at block 410
      // await time.advanceBlockTo("409")
      // await this.chef.connect(this.alice).deposit(0, "10", { from: this.alice.address })
      // // Add LP2 to the pool with allocation 2 at block 420
      // await time.advanceBlockTo("419")
      // await this.chef.add("20", this.lp2.address, true)
      // // Alice should have 10*1000 pending reward
      // expect(await this.chef.pendingAnnex(0, this.alice.address)).to.equal("10000")
      // // Bob deposits 10 LP2s at block 425
      // await time.advanceBlockTo("424")
      // await this.chef.connect(this.bob).deposit(1, "5", { from: this.bob.address })
      // // Alice should have 10000 + 5*1/3*1000 = 11666 pending reward
      // expect(await this.chef.pendingAnnex(0, this.alice.address)).to.equal("11666")
      // await time.advanceBlockTo("430")
      // // At block 430. Bob should get 5*2/3*1000 = 3333. Alice should get ~1666 more.
      // expect(await this.chef.pendingAnnex(0, this.alice.address)).to.equal("13333")
      // expect(await this.chef.pendingAnnex(1, this.bob.address)).to.equal("3333")
    })

    it("should get all of p0ending boost rewards", async function() {
      this.chef = await this.AnnexBoostFarm.deploy(
        this.annex.address,
        this.rewardToken.address,
        this.vAnn.address,
        this.boostToken.address,
        "100",
        "100",
        "0"
      )
      await this.chef.deployed()

      this.rewardToken.transfer(this.chef.address, "10000")
      this.vAnn.setStakingInfo(this.chef.address, 0)
      this.vAnn.transferOwnership(this.chef.address, true, false)
      await this.boostToken.setStakingAddress(this.chef.address)
      await this.chef.updateClaimBaseRewardTime(0)
      await this.chef.updateUnstakableTime(1)
      await this.chef.updateClaimBoostRewardTime(0)

      await this.boostToken.gift(15, this.bob.address)
      await this.boostToken.gift(15, this.alice.address)
      await this.boostToken.gift(15, this.carol.address)
      await this.boostToken.connect(this.bob).setApprovalForAll(this.chef.address, true, { from: this.bob.address })
      await this.boostToken.connect(this.alice).setApprovalForAll(this.chef.address, true, { from: this.alice.address })
      await this.boostToken.connect(this.carol).setApprovalForAll(this.chef.address, true, { from: this.carol.address })

      await this.chef.add("100", this.annex.address, true)
      await this.annex.connect(this.alice).approve(this.chef.address, "1000", {
        from: this.alice.address,
      })
      await this.annex.connect(this.bob).approve(this.chef.address, "1000", {
        from: this.bob.address,
      })
      await this.annex.connect(this.carol).approve(this.chef.address, "1000", {
        from: this.carol.address,
      })

      await time.advanceBlockTo("500")
      await this.chef.connect(this.bob).deposit(0, "50", { from: this.bob.address }) // block 501
      await this.chef.connect(this.alice).deposit(0, "50", { from: this.alice.address }) // block 502
      expect(await this.vAnn.balanceOf(this.bob.address)).to.equal("500")
      expect(await this.vAnn.balanceOf(this.alice.address)).to.equal("500")
      await this.chef.connect(this.bob).boost(0, 1, { from: this.bob.address }) // block 503
      await this.chef.connect(this.alice).boost(0, 16, { from: this.alice.address }) // block 504

      await time.advanceBlockTo("514")
      expect(await this.chef.pendingBaseReward(0, this.alice.address)).to.equal("500")
      expect(await this.chef.pendingBaseReward(0, this.carol.address)).to.equal("0")
      await this.vAnn.connect(this.alice).transfer(this.carol.address, 100, { from: this.alice.address }) // block 515
      expect(await this.rewardToken.balanceOf(this.alice.address)).to.equal("550")
      expect(await this.vAnn.balanceOf(this.bob.address)).to.equal("500")
      expect(await this.vAnn.balanceOf(this.alice.address)).to.equal("400")
      expect(await this.vAnn.balanceOf(this.carol.address)).to.equal("100")
      expect(await this.chef.pendingBaseReward(0, this.alice.address)).to.equal("0")
      expect(await this.chef.pendingBaseReward(0, this.carol.address)).to.equal("0")
      await this.chef.connect(this.carol).boost(0, 31, { from: this.carol.address }) // block 414

      await time.advanceBlockTo("525")
      expect(await this.chef.pendingBaseReward(0, this.alice.address)).to.equal("367")
      expect(await this.chef.pendingBaseReward(0, this.carol.address)).to.equal("81")
      await this.chef.connect(this.bob).deposit(0, 0, { from: this.bob.address }) // block 526
      await time.advanceBlockTo("537")
      expect(await this.chef.pendingBaseReward(0, this.bob.address)).to.equal("500")

      await this.chef.connect(this.alice).deposit(0, 0, { from: this.alice.address }) // block 538
      await time.advanceBlockTo("549")
      expect(await this.chef.pendingBaseReward(0, this.alice.address)).to.equal("400")

      await this.chef.connect(this.carol).deposit(0, 0, { from: this.carol.address }) // block 550
      await time.advanceBlockTo("561")
      expect(await this.chef.pendingBaseReward(0, this.carol.address)).to.equal("100")
      await this.chef.connect(this.carol).unBoost(0, 31, { from: this.carol.address })
      // console.log(await this.chef.getUserInfo(0, this.carol.address))
    })

    it("should reset timers and lost boost rewards", async function() {
      this.chef = await this.AnnexBoostFarm.deploy(
        this.annex.address,
        this.rewardToken.address,
        this.vAnn.address,
        this.boostToken.address,
        "100",
        "100",
        "0"
      )
      await this.chef.deployed()

      this.rewardToken.transfer(this.chef.address, "10000")
      this.vAnn.setStakingInfo(this.chef.address, 0)
      this.vAnn.transferOwnership(this.chef.address, true, false)
      await this.boostToken.setStakingAddress(this.chef.address)
      // await this.chef.updateClaimBaseRewardTime(0)
      await this.chef.updateUnstakableTime(1)
      // await this.chef.updateClaimBoostRewardTime(0)

      await this.boostToken.gift(15, this.bob.address)
      await this.boostToken.gift(15, this.alice.address)
      await this.boostToken.gift(15, this.carol.address)
      await this.boostToken.connect(this.bob).setApprovalForAll(this.chef.address, true, { from: this.bob.address })
      await this.boostToken.connect(this.alice).setApprovalForAll(this.chef.address, true, { from: this.alice.address })
      await this.boostToken.connect(this.carol).setApprovalForAll(this.chef.address, true, { from: this.carol.address })

      await this.chef.add("100", this.annex.address, true)
      await this.annex.connect(this.alice).approve(this.chef.address, "1000", {
        from: this.alice.address,
      })
      await this.annex.connect(this.bob).approve(this.chef.address, "1000", {
        from: this.bob.address,
      })
      await this.annex.connect(this.carol).approve(this.chef.address, "1000", {
        from: this.carol.address,
      })

      await time.advanceBlockTo("600")
      await this.chef.connect(this.bob).deposit(0, "50", { from: this.bob.address }) // block 601
      await this.chef.connect(this.alice).deposit(0, "50", { from: this.alice.address }) // block 602
      expect(await this.vAnn.balanceOf(this.bob.address)).to.equal("500")
      expect(await this.vAnn.balanceOf(this.alice.address)).to.equal("500")
      await this.chef.connect(this.bob).boost(0, 1, { from: this.bob.address }) // block 603
      await this.chef.connect(this.alice).boost(0, 16, { from: this.alice.address }) // block 604
      await this.chef.connect(this.alice).boost(0, 17, { from: this.alice.address }) // block 605

      await time.advanceBlockTo("614")
      expect(await this.chef.pendingBaseReward(0, this.bob.address)).to.equal("600")
      expect(await this.chef.pendingBaseReward(0, this.alice.address)).to.equal("500")
      expect(await this.chef.pendingBaseReward(0, this.carol.address)).to.equal("0")
      // 450 * 0.4 = 180
      expect(await this.chef.pendingBoostReward(0, this.alice.address)).to.equal("180")
      expect(await this.chef.pendingBoostReward(0, this.bob.address)).to.equal("0")

      await this.chef.connect(this.alice).unBoost(0, 17, { from: this.alice.address }) // block 615
      expect(await this.chef.pendingBoostReward(0, this.alice.address)).to.equal("0")

      await this.chef.connect(this.alice).boost(0, 17, { from: this.alice.address }) // block 616
      await time.advanceBlockTo("626")
      expect(await this.chef.pendingBaseReward(0, this.alice.address)).to.equal("1100")
      expect(await this.chef.pendingBoostReward(0, this.alice.address)).to.equal("200")

      this.vAnn.connect(this.alice).approve(this.chef.address, '100000000000000000000000000000000', { from: this.alice.address }) // block 617
      await this.chef.connect(this.alice).withdraw(0, "10", { from: this.alice.address }) // block 618
      expect(await this.chef.pendingBaseReward(0, this.alice.address)).to.equal("1200")
      expect(await this.chef.pendingBoostReward(0, this.alice.address)).to.equal("0")
    })

    it("should boost/unbost successfully", async function() {
      this.chef = await this.AnnexBoostFarm.deploy(
        this.annex.address,
        this.rewardToken.address,
        this.vAnn.address,
        this.boostToken.address,
        "100",
        "100",
        "0"
      )
      await this.chef.deployed()

      this.rewardToken.transfer(this.chef.address, "10000")
      this.vAnn.setStakingInfo(this.chef.address, 0)
      this.vAnn.transferOwnership(this.chef.address, true, false)
      await this.boostToken.setStakingAddress(this.chef.address)
      // await this.chef.updateClaimBaseRewardTime(0)
      // await this.chef.updateUnstakableTime(0)
      // await this.chef.updateClaimBoostRewardTime(0)

      await this.boostToken.gift(15, this.bob.address)
      await this.boostToken.gift(15, this.alice.address)
      await this.boostToken.gift(15, this.carol.address)
      await this.boostToken.connect(this.bob).setApprovalForAll(this.chef.address, true, { from: this.bob.address })
      await this.boostToken.connect(this.alice).setApprovalForAll(this.chef.address, true, { from: this.alice.address })
      await this.boostToken.connect(this.carol).setApprovalForAll(this.chef.address, true, { from: this.carol.address })

      await this.chef.add("100", this.annex.address, true)
      await this.annex.connect(this.alice).approve(this.chef.address, "1000", {
        from: this.alice.address,
      })
      await this.annex.connect(this.bob).approve(this.chef.address, "1000", {
        from: this.bob.address,
      })
      await this.annex.connect(this.carol).approve(this.chef.address, "1000", {
        from: this.carol.address,
      })

      await time.advanceBlockTo("700")
      await this.chef.connect(this.bob).deposit(0, "50", { from: this.bob.address }) // block 701
      await this.chef.connect(this.alice).deposit(0, "50", { from: this.alice.address }) // block 702
      expect(await this.vAnn.balanceOf(this.bob.address)).to.equal("500")
      expect(await this.vAnn.balanceOf(this.alice.address)).to.equal("500")
      await this.chef.connect(this.bob).boost(0, 1, { from: this.bob.address }) // block 703
      await this.chef.connect(this.alice).boost(0, 16, { from: this.alice.address }) // block 704
      await this.chef.connect(this.alice).boost(0, 17, { from: this.alice.address }) // block 705

      await this.chef.connect(this.bob).boostPartially(0, 3, { from: this.bob.address }) // block 706
      await this.chef.connect(this.alice).boostAll(0, [18,19,20,21,22,23,24,25,26,27,28,29,30], { from: this.alice.address }) // block 707
      await this.chef.connect(this.bob).boostPartially(0, 4, { from: this.bob.address }) // block 708

      await this.chef.connect(this.alice).unBoostPartially(0, 3, { from: this.alice.address }) // block 709
      await time.advanceBlockTo("720")
      await this.chef.connect(this.bob).unBoostPartially(0, 3, { from: this.bob.address }) // block 710
      await time.advanceBlockTo("730")
      await this.chef.connect(this.bob).unBoostAll(0, { from: this.bob.address }) // block 710
    })

    it("should be different pendingBoostReward and claimablePendingBoostReward", async function() {
      this.chef = await this.AnnexBoostFarm.deploy(
        this.annex.address,
        this.rewardToken.address,
        this.vAnn.address,
        this.boostToken.address,
        "100",
        "100",
        "0"
      )
      await this.chef.deployed()

      this.rewardToken.transfer(this.chef.address, "10000")
      this.vAnn.setStakingInfo(this.chef.address, 0)
      this.vAnn.transferOwnership(this.chef.address, true, false)
      await this.boostToken.setStakingAddress(this.chef.address)
      // await this.chef.updateClaimBaseRewardTime(0)
      // await this.chef.updateUnstakableTime(0)
      // await this.chef.updateClaimBoostRewardTime(0)

      await this.boostToken.gift(15, this.bob.address)
      await this.boostToken.gift(15, this.alice.address)
      await this.boostToken.gift(15, this.carol.address)
      await this.boostToken.connect(this.bob).setApprovalForAll(this.chef.address, true, { from: this.bob.address })
      await this.boostToken.connect(this.alice).setApprovalForAll(this.chef.address, true, { from: this.alice.address })
      await this.boostToken.connect(this.carol).setApprovalForAll(this.chef.address, true, { from: this.carol.address })

      await this.chef.add("100", this.annex.address, true)
      await this.annex.connect(this.alice).approve(this.chef.address, "1000", {
        from: this.alice.address,
      })
      await this.annex.connect(this.bob).approve(this.chef.address, "1000", {
        from: this.bob.address,
      })
      await this.annex.connect(this.carol).approve(this.chef.address, "1000", {
        from: this.carol.address,
      })

      await time.advanceBlockTo("800")
      await this.chef.connect(this.bob).deposit(0, "100", { from: this.bob.address }) // block 701
      await this.chef.connect(this.alice).deposit(0, "100", { from: this.alice.address }) // block 702
      await this.chef.connect(this.carol).deposit(0, "100", { from: this.carol.address }) // block 702
      await this.chef.connect(this.bob).boost(0, 1, { from: this.bob.address }) // block 703
      await this.chef.connect(this.alice).boost(0, 16, { from: this.alice.address }) // block 704
      await this.chef.connect(this.alice).boost(0, 17, { from: this.alice.address }) // block 705

      await this.chef.connect(this.bob).boostPartially(0, 3, { from: this.bob.address }) // block 706
      await this.chef.connect(this.alice).boostAll(0, [18,19,20,21,22,23,24,25,26,27,28,29,30], { from: this.alice.address }) // block 707
      await this.chef.connect(this.bob).boostPartially(0, 4, { from: this.bob.address }) // block 708
      await this.chef.connect(this.carol).boostPartially(0, 4, { from: this.carol.address }) // block 708
      expect(await this.chef.pendingBoostReward(0, this.bob.address)).to.equal("160")
      expect(await this.chef.pendingBoostReward(0, this.alice.address)).to.equal("240")
      expect(await this.chef.pendingBoostReward(0, this.carol.address)).to.equal("0")
      expect(await this.chef.getClaimablePendingBoostRewards()).to.equal("0")
      expect(await this.chef.getTotalPendingBoostRewards()).to.equal("400")

      // await this.chef.connect(this.alice).unBoostPartially(0, 3, { from: this.alice.address }) // block 709
      // await time.advanceBlockTo("720")
      // await this.chef.connect(this.bob).unBoostPartially(0, 3, { from: this.bob.address }) // block 710
      // await time.advanceBlockTo("730")
      // await this.chef.connect(this.bob).unBoostAll(0, { from: this.bob.address }) // block 710
    })
  })
})
