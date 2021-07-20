// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as path from "path";
import * as pfs from "./promise-fs";
import * as vscode from "vscode";

export interface CondaEnvironments {
    name: string;
    current:  boolean;
    path: string;
}

export async function getCondaCommand() : Promise<string> {
  if (process.platform === "win32") {
    // Check for conda or mamba
    var mambaLocal = path.join("process.env.LOCALAPPDATA", "mambaforge");
    var mambaGlobal = path.join("process.env.ProgramFiles", "mambaforge");
    var condaLocal = path.join("process.env.LOCALAPPDATA", "condaforge");
    var condaGlobal = path.join("process.env.LOCALAPPDATA", "condaforge");

    if (await pfs.exists(mambaLocal))
      return mambaLocal;
    else if (await pfs.exists(mambaGlobal))
      return mambaGlobal;
    else if (await pfs.exists(condaLocal))
      return condaLocal;
    else if (await pfs.exists(condaGlobal))
      return condaGlobal;
  }

  return undefined;
}

export async function hasConda() : Promise<boolean> {
  var command = await getCondaCommand();
  return command !== undefined;
}

export async function getEnvironments(extensionId: string): Promise<CondaEnvironments[]> {
  var condaCommand = await getCondaCommand();

  const { stdout, stderr } = await child_process.exec(colconCommand);

  // Does this workspace have packages?
  for await (const line of stdout) {
      // Yes.
      return true;
  }
}
