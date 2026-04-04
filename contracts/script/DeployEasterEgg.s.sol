// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EasterEgg.sol";

contract DeployEasterEgg is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        EasterEgg egg = new EasterEgg();

        vm.stopBroadcast();

        console.log("EasterEgg deployed at:", address(egg));
    }
}
