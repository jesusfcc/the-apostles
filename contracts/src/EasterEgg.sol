// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EasterEgg is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    mapping(address => bool) public hasMinted;

    error AlreadyMinted();
    error NotTokenOwner();

    constructor() ERC721("Easter Egg", "EGG") Ownable(msg.sender) {}

    function mint(string calldata _tokenURI) external {
        if (hasMinted[msg.sender]) revert AlreadyMinted();

        hasMinted[msg.sender] = true;
        uint256 tokenId = _nextTokenId++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
    }

    function burn(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        _update(address(0), tokenId, msg.sender);
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
