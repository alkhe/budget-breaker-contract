import { ethers } from 'hardhat'

const { Wallet } = ethers

async function main() {
  const wallets = await ethers.getSigners()
  const TestToken = await ethers.getContractFactory('TestToken')
  const xtt = TestToken.attach('0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0')

  console.log(await xtt.name())

  for (const w of wallets) {
    console.log(w.address)
    console.log('Balance: ' + await xtt.balanceOf(w.address))
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})


