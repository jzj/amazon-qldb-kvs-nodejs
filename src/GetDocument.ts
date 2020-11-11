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
import { dom } from "ion-js";
import { log } from "./Logging";
import { MAX_KEYS_TO_RETRIEVE } from "./Constants";
const logger = log.getLogger("qldb-helper");

/**
 * Generates parameter string for queries with many similar params.
 * @param numberOfParams Number of ? characters in query.
 * @returns A paramter string formatted similar to [?, ?, ?].
 */
function getBindParametersString(numberOfParams: number): String {
    let paramStr = "["
    for (let i = 0; i < numberOfParams; i++) {
        if (i == (numberOfParams - 1)) {
            //Handle the last element
            paramStr += "?]"
        } else {
            //everything else
            paramStr += "?, "
        }
    }
    return paramStr;
}

/**
 * Gets a document by the value of one attribute.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param tableName The name of a table.
 * @param keyAttributeName The name of an attribute for indexing.
 * @param keyAttributeValue A value of a key attribute.
 * @returns Array of results as ION documents.
 * @throws Error: If error happen during the process.
 */
export async function getByKeyAttribute(txn: TransactionExecutor, tableName: string, keyAttributeName: string, keyAttributeValue: string): Promise<dom.Value[]> {
    const fcnName: string = "[QLDBHelper.getByKeyAttribute]"
    const startTime: number = new Date().getTime();

    try {
        const query: string = `SELECT * FROM ${tableName} AS d BY id  WHERE d.${keyAttributeName} = ?`;

        logger.debug(`${fcnName} Retrieving document values for Key: ${keyAttributeValue}`);
        logger.debug(`${fcnName} Query statement: ${query}`);

        const result: Result = await txn.execute(query, keyAttributeValue)
        const endTime = new Date().getTime();
        logger.debug(`${fcnName} Execution time: ${endTime - startTime}ms`)
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length === 0) {
            throw `${fcnName} Unable to find document with Key: ${keyAttributeValue}.`;
        }
        return resultList;
    } catch (err) {
        const endTime: number = new Date().getTime();
        logger.debug(`${fcnName} Execution time: ${endTime - startTime}ms`)
        throw new Error(err);
    }
}

/**
 * Gets a document by the value of one attribute.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param tableName The name of a table.
 * @param keyAttributeName The name of an attribute for indexing.
 * @param keyAttributeValues An array of values of key attribute.
 * @returns Array of results as ION documents.
 * @throws Error: If error happen during the process.
 */
export async function getByKeyAttributes(txn: TransactionExecutor, tableName: string, keyAttributeName: string, keyAttributeValues: string[]): Promise<dom.Value[]> {
    const fcnName: string = "[QLDBHelper.getByKeyAttributes]"
    const startTime: number = new Date().getTime();

    try {
        const query: string = `SELECT * FROM ${tableName} AS d BY id  WHERE d.${keyAttributeName} IN ${getBindParametersString(keyAttributeValues.length)}`;

        if (keyAttributeValues.length > MAX_KEYS_TO_RETRIEVE) throw `We should retrieve not more then ${MAX_KEYS_TO_RETRIEVE} keys at a time.`

        logger.debug(`${fcnName} Retrieving document values for Keys: ${keyAttributeValues}`);
        logger.debug(`${fcnName} Query statement: ${query}`);

        const result: Result = await txn.execute(query, ...keyAttributeValues)
        const endTime = new Date().getTime();
        logger.debug(`${fcnName} Execution time: ${endTime - startTime}ms`)
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length === 0) {
            throw `${fcnName} Unable to find documents with Keys: ${keyAttributeValues}.`;
        }
        return resultList;
    } catch (err) {
        const endTime: number = new Date().getTime();
        logger.debug(`${fcnName} Execution time: ${endTime - startTime}ms`)
        throw new Error(err);
    }
}

/**
 * Gets a document by QLDB Document Id
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param tableName The name of a table.
 * @param documentId Document Id string.
 * @returns Array of results as ION documents.
 * @throws Error: If error happen during the process.
 */
export async function getDocumentById(txn: TransactionExecutor, tableName: string, documentId: string): Promise<dom.Value[]> {
    const fcnName: string = "[QLDBHelper.getDocumentById]"
    const startTime: number = new Date().getTime();

    try {
        const query: string = `SELECT * FROM ${tableName} BY id  WHERE id = ?`;

        logger.debug(`${fcnName} Retrieving document with Id: ${documentId}`);
        logger.debug(`${fcnName} Query statement: ${query}`);

        const result: Result = await txn.execute(query, documentId);
        const endTime = new Date().getTime();
        logger.debug(`${fcnName} Execution time: ${endTime - startTime}ms`)
        const resultList: dom.Value[] = result.getResultList();
        if (resultList.length === 0) {
            throw `${fcnName} Unable to find document Id: ${documentId}.`;
        }
        return resultList;
    } catch (err) {
        const endTime: number = new Date().getTime();
        logger.debug(`${fcnName} Execution time: ${endTime - startTime}ms`)
        throw new Error(err);
    }
}