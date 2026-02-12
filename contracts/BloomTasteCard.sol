// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BloomTasteCard
 * @notice Soulbound Token (SBT) representing a user's Bloom Taste Card.
 *         Non-transferable — only minting is allowed, no transfers or burns.
 *         Owner (agent wallet) can mint new tokens and update tokenURIs.
 */
contract BloomTasteCard is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("Bloom Taste Card", "TASTE") Ownable(msg.sender) {}

    /**
     * @notice Mint a new Taste Card to `to` with the given metadata URI.
     * @dev Only the contract owner (agent wallet) can call this.
     */
    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /**
     * @notice Update the tokenURI for an existing token (e.g. after re-analysis).
     * @dev Only the contract owner can call this.
     */
    function updateTokenURI(uint256 tokenId, string memory uri) public onlyOwner {
        _setTokenURI(tokenId, uri);
    }

    // --- Soulbound: block all transfers except mint ---

    /**
     * @dev Override _update to prevent transfers. Only minting (from == address(0)) is allowed.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) {
            revert("BloomTasteCard: soulbound, transfer blocked");
        }
        return super._update(to, tokenId, auth);
    }

    // --- Required overrides for ERC721URIStorage ---

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
