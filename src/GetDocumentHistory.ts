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

import { TransactionExecutor, Result } from "amazon-qldb-driver-nodejs";
import { getDocumentIds } from "./Util";
import { dom } from "ion-js";
import { log } from "./Logging";
import { ValueHolder } from "aws-sdk/clients/qldbsession";
const logger = log.getLogger("qldb-helper");

/**
 * Gets a document version by Id and Block Sequence Number
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param {string} tableName The name of a table.
 * @param {string} documentId An Id of the document, generated by QLDB. Can be retrieved through Utils.getDocumentIds function.
 * @param {number} blockSequenceNo A Block Sequence Number. Can be retrieved through GetMetadata.lookupBlockAddressAndDocIdForKey
 * @returns An ION document.
 * @throws Error: If error happen during the process.
 */
export async function getDocumentRevisionByIdAndBlock(txn: TransactionExecutor, tableName: string, documentId: string, blockAddress: ValueHolder): Promise<dom.Value> {
    const fcnName: string = "[GetDocumentHistory.getDocumentRevisionByIdAndBlock]"
    const startTime: number = new Date().getTime();

    try {
        const blockAddressIon: dom.Value = dom.load(blockAddress.IonText);
        const blockSequenceNo = blockAddressIon.get("sequenceNo");
        const query: string = `SELECT * FROM history( ${tableName} ) AS h WHERE h.metadata.id = ? AND h.blockAddress.sequenceNo = ?`;

        logger.debug(`${fcnName} Retrieving document values for Id: ${documentId} and Block Sequence Number: ${blockSequenceNo}`);
        logger.debug(`${fcnName} Query statement: ${query}`);

        const result: Result = await txn.execute(query, documentId, blockSequenceNo);
        const endTime = new Date().getTime();
        logger.debug(`${fcnName} Execution time: ${endTime - startTime}ms`)
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length === 0) {
            throw new Error(`${fcnName} Unable to find document with Id: ${documentId} and Block Sequence Number: ${blockSequenceNo}`);
        }
        return resultList[0];
    } catch (err) {
        const endTime: number = new Date().getTime();
        logger.debug(`${fcnName} Execution time: ${endTime - startTime}ms`)
        throw new Error(err);
    }
}

/**
 * Gets all document versions for a specific key
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param {string} tableName The name of a table.
 * @param {string} keyAttributeName A keyAttributeName to query.
 * @param {string} keyAttributeValue The key of the given keyAttributeName.
 * @returns An ION document.
 * @throws Error: If error happen during the process.
 */
export async function getDocumentHistory(txn: TransactionExecutor, tableName: string, keyAttributeName: string, keyAttributeValue: string): Promise<dom.Value[]> {
    const fcnName: string = "[GetDocumentHistory.getDocumentRevisionByIdAndBlock]"
    const startTime: number = new Date().getTime();
    let documentId: string;

    try {
        const documentIds = await getDocumentIds(txn, tableName, keyAttributeName, keyAttributeValue);
        documentId = documentIds[0];

        const query: string = `SELECT * FROM history( ${tableName} ) AS h WHERE h.metadata.id = ? `;

        logger.debug(`${fcnName} Retrieving document history for Id: ${documentId}`);
        logger.debug(`${fcnName} Query statement: ${query}`);

        const result: Result = await txn.execute(query, documentId);
        const endTime = new Date().getTime();
        logger.debug(`${fcnName} Execution time: ${endTime - startTime}ms`)
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length === 0) {
            throw `${fcnName} Unable to find document history with Id: ${documentId}`;
        }
        return resultList;
    } catch (err) {
        const endTime: number = new Date().getTime();
        logger.debug(`${fcnName} Execution time: ${endTime - startTime}ms`)
        throw new Error(`${fcnName} ${err}`);
    }
}