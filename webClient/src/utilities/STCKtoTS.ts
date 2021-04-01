/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
import * as Long from 'long';

const EPOCH_IN_STCK = "9048018124800000000" // a constant value that denotes Unix epoch time in STCK units

export default function STCKtoTS(stckTime: string): Date {
    const longStckTime = Long.fromString(stckTime, true, 10);
    const unixEpoch = longStckTime.subtract(EPOCH_IN_STCK).shru(12).divide(1000);
    const timestamp = new Date(0);
    timestamp.setMilliseconds(unixEpoch.toNumber());
    return timestamp;
}

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
