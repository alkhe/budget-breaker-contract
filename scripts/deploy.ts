import { ethers } from 'hardhat'

const { Wallet } = ethers

async function main() {
  const wallets = await ethers.getSigners()
  const wallet0 = wallets[0]

  const Multicall = await ethers.getContractFactory('Multicall')
  const multicall = await Multicall.deploy()
  await multicall.deployed()

  console.log('Multicall deployed to:', multicall.address)

  const TestToken = await ethers.getContractFactory('TestToken')
  const test_token = await TestToken.connect(wallet0).deploy()
  await test_token.deployed()

  console.log('TestToken deployed to:', test_token.address)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
