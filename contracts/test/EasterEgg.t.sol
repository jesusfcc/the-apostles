// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EasterEgg.sol";

contract EasterEggTest is Test {
    EasterEgg public egg;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        egg = new EasterEgg();
    }

    function test_mint() public {
        vm.prank(alice);
        egg.mint("https://arweave.net/abc123");

        assertEq(egg.ownerOf(0), alice);
        assertEq(egg.tokenURI(0), "https://arweave.net/abc123");
        assertTrue(egg.hasMinted(alice));
        assertEq(egg.totalSupply(), 1);
    }

    function test_mint_reverts_duplicate() public {
        vm.startPrank(alice);
        egg.mint("https://arweave.net/abc123");

        vm.expectRevert(EasterEgg.AlreadyMinted.selector);
        egg.mint("https://arweave.net/def456");
        vm.stopPrank();
    }

    function test_burn() public {
        vm.prank(alice);
        egg.mint("https://arweave.net/abc123");

        vm.prank(alice);
        egg.burn(0);

        vm.expectRevert();
        egg.ownerOf(0);
    }

    function test_burn_reverts_non_owner() public {
        vm.prank(alice);
        egg.mint("https://arweave.net/abc123");

        vm.prank(bob);
        vm.expectRevert(EasterEgg.NotTokenOwner.selector);
        egg.burn(0);
    }

    function test_multiple_minters() public {
        vm.prank(alice);
        egg.mint("https://arweave.net/alice");

        vm.prank(bob);
        egg.mint("https://arweave.net/bob");

        assertEq(egg.ownerOf(0), alice);
        assertEq(egg.ownerOf(1), bob);
        assertEq(egg.totalSupply(), 2);
    }
}
