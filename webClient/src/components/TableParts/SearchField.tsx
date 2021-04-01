/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
import * as React from 'react';
import TextField from '@material-ui/core/TextField';

const SearchField: React.FC<any> = props => {

    const [value, setValue] = React.useState(props.predefinedFilter ? props.predefinedFilter : '');

    return (
        <TextField
            id="standard-search"
            label={props.t('search')}
            type="search"
            size="small"
            disabled={props.loading}
            value={value}
            onChange={evt => {
                setValue(evt.target.value);
                props.setFilter(evt.target.value);
            }}
        />
    );

}

export default SearchField;

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
