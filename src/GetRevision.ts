/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *   
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { QLDB } from "aws-sdk";
import { GetRevisionRequest, GetRevisionResponse, ValueHolder } from "aws-sdk/clients/qldb";

import { log } from "./Logging";
const logger = log.getLogger("qldb-helper");

/**
 * Get the revision data object for a specified document ID and block address.
 * Also returns a proof of the specified revision for verification.
 * @param ledgerName Name of the ledger containing the document to query.
 * @param documentId Unique ID for the document to be verified, contained in the committed view of the document.
 * @param blockAddress The location of the block to request.
 * @param digestTipAddress The latest block location covered by the digest.
 * @param qldbClient The QLDB control plane client to use.
 * @returns Promise which fulfills with a GetRevisionResponse.
 */
export async function getRevision(
    ledgerName: string,
    documentId: string,
    blockAddress: ValueHolder,
    digestTipAddress: ValueHolder,
    qldbClient: QLDB
): Promise<GetRevisionResponse> {
    const fcnName = "[GetRevision getRevision]"
    try {
        const request: GetRevisionRequest = {
            Name: ledgerName,
            BlockAddress: blockAddress,
            DocumentId: documentId,
            DigestTipAddress: digestTipAddress
        };
        const result: GetRevisionResponse = await qldbClient.getRevision(request).promise();
        return result;
    } catch (err) {
        throw `${fcnName} ${err} `
    }
}
