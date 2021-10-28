import { expect } from 'chai'
import { ethers } from 'hardhat'

const { Wallet, provider } = ethers

async function wait_until(time: number) {
  return new Promise(res => {
    setTimeout(res, time - Date.now())
  })
}

describe('BudgetBreaker', function () {
  it('should successfully disburse when target output met', async function () {
    console.log('[wallets] fetching')
    const wallets = await ethers.getSigners()

    console.log('[XTT] deploying')
    const TestToken = await ethers.getContractFactory('TestToken')
    const test_token = await TestToken.deploy()

    const controller_wallet = wallets[0]
    const residual_wallet = wallets[1]

    const member_wallets = wallets.slice(2, 5)

    const latestBlock = await provider.getBlock(await provider.getBlockNumber())

    const now = latestBlock.timestamp * 1000
    const execution_deadline = now + 6000
    const completion_deadline = now + 7000

    console.log('[test] now:', (new Date(now)).toLocaleString())

    console.log('[BB] deploying')
    const BudgetBreaker = await ethers.getContractFactory('BudgetBreaker')
    const budget_breaker = await BudgetBreaker.deploy(
      test_token.address, controller_wallet.address, residual_wallet.address, member_wallets.map(w => w.address),
      350000, 100000,
      execution_deadline, completion_deadline
    )

    console.log('[BB] signing')
    await Promise.all(member_wallets.map(w => budget_breaker.connect(w).sign()))

    console.log('[BB] executing')
    await budget_breaker.connect(controller_wallet).execute()

    console.log('[XTT] executing')
    await test_token.transfer(budget_breaker.address, 500000)

    console.log('[test] waiting until completion deadline')
    await wait_until(completion_deadline)

    console.log('[BB] completing')
    await budget_breaker.connect(controller_wallet).complete()

    const residual_balance = await test_token.balanceOf(residual_wallet.address)
    expect(residual_balance).to.equal(200000)
  })

  it('should successfully disburse when target output not met', async function () {
    console.log('[wallets] fetching')
    const wallets = await ethers.getSigners()

    console.log('[XTT] deploying')
    const TestToken = await ethers.getContractFactory('TestToken')
    const test_token = await TestToken.deploy()

    const controller_wallet = wallets[0]
    const residual_wallet = wallets[1]

    const member_wallets = wallets.slice(2, 5)

    const latestBlock = await provider.getBlock(await provider.getBlockNumber())

    const now = latestBlock.timestamp * 1000

    const execution_deadline = now + 6000
    const completion_deadline = now + 7000

    console.log('[test] now:', (new Date(now)).toLocaleString())

    console.log('[BB] deploying')
    const BudgetBreaker = await ethers.getContractFactory('BudgetBreaker')
    const budget_breaker = await BudgetBreaker.deploy(
      test_token.address, controller_wallet.address, residual_wallet.address, member_wallets.map(w => w.address),
      350000, 100000,
      execution_deadline, completion_deadline
    )

    console.log('[BB] signing')
    await Promise.all(member_wallets.map(w => budget_breaker.connect(w).sign()))

    console.log('[BB] executing')
    await budget_breaker.connect(controller_wallet).execute()

    console.log('[XTT] executing')
    await test_token.transfer(budget_breaker.address, 250000)

    console.log('[test] waiting until completion deadline')
    await wait_until(completion_deadline)

    console.log('[BB] completing')
    await budget_breaker.connect(controller_wallet).complete()

    const residual_balance = await test_token.balanceOf(residual_wallet.address)
    expect(residual_balance).to.equal(250000)
  })
})

