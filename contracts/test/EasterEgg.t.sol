// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EasterEgg.sol";

contract EasterEggTest is Test {
    EasterEgg public egg;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    uint256 public constant PRICE = 0.001 ether;

    function setUp() public {
        egg = new EasterEgg(PRICE);
        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
    }

    function test_mint() public {
        vm.prank(alice);
        uint256 tokenId = egg.mint{value: PRICE}("https://arweave.net/abc");
        assertEq(tokenId, 0);
        assertEq(egg.ownerOf(0), alice);
        assertEq(egg.tokenURI(0), "https://arweave.net/abc");
    }

    function test_mint_multiple() public {
        vm.startPrank(alice);
        egg.mint{value: PRICE}("https://arweave.net/1");
        egg.mint{value: PRICE}("https://arweave.net/2");
        vm.stopPrank();
        assertEq(egg.totalSupply(), 2);
        assertEq(egg.tokenURI(0), "https://arweave.net/1");
        assertEq(egg.tokenURI(1), "https://arweave.net/2");
    }

    function test_mint_insufficient_payment() public {
        vm.prank(alice);
        vm.expectRevert(EasterEgg.InsufficientPayment.selector);
        egg.mint{value: 0.0001 ether}("uri");
    }

    function test_burn() public {
        vm.prank(alice);
        egg.mint{value: PRICE}("uri");
        vm.prank(alice);
        egg.burn(0);
        vm.expectRevert();
        egg.ownerOf(0);
    }

    function test_burn_reverts_non_owner() public {
        vm.prank(alice);
        egg.mint{value: PRICE}("uri");
        vm.prank(bob);
        vm.expectRevert(EasterEgg.NotTokenOwner.selector);
        egg.burn(0);
    }

    function test_evolve() public {
        vm.prank(alice);
        egg.mint{value: PRICE}("uri1");
        vm.prank(alice);
        egg.evolve(0, "uri2");
        vm.expectRevert();
        egg.ownerOf(0);
        assertEq(egg.ownerOf(1), alice);
        assertEq(egg.tokenURI(1), "uri2");
    }

    function test_withdraw() public {
        vm.prank(alice);
        egg.mint{value: PRICE}("uri");
        egg.transferOwnership(alice);
        uint256 bal = alice.balance;
        vm.prank(alice);
        egg.withdraw();
        assertEq(alice.balance, bal + PRICE);
    }

    function test_free_mint() public {
        EasterEgg free = new EasterEgg(0);
        vm.prank(alice);
        free.mint("uri");
        assertEq(free.ownerOf(0), alice);
    }
}
