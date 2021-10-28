import { ethers } from 'hardhat'

const { Wallet } = ethers

async function main() {
  const TestToken = await ethers.getContractFactory('TestToken')
  const test_token = await TestToken.deploy()

  console.log('TestToken deployed to:', test_token.address)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})

