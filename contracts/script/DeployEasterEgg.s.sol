// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EasterEgg.sol";

contract DeployEasterEgg is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        uint256 mintPrice = vm.envOr("MINT_PRICE", uint256(0.001 ether));
        EasterEgg egg = new EasterEgg(mintPrice);

        vm.stopBroadcast();

        console.log("EasterEgg deployed at:", address(egg));
    }
}
