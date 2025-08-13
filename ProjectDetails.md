# Software Solution / Design Document - ShipmentDB

## Problem Statement:

- Currently there are ~$150,000 lost per year to theft of tools. There is no implemented tracking or detailing of where these tools are for recovery and proper actions. Previously used TrackVia, but canceled the subscription due to price which deleted their database.

## Project Requirements:
- Logging / tracking of history of jobs and respective tools
- Tracking of current tools whereabouts
- View missing (unreturned) tools
- Easily adding the information to the database through scanning the barcode
  

## High-Level Solution
#### 3 Modes to scan tools:
1. **Mode 1**: Adding new tool to DB
	1. New tools get scanned into the system with their toolType (ENUM) along with it
2. **Mode 2**: Adding tools to a new job
	1. Job gets communicated to the computer
	2. Give the app the job you'd like to scan tools for
	3. Scan each of the tools
3. **Mode 3**: Returning tools from the job
	1. Tell the app which job you're returning tools for
	2. Scan each of the returned tools
	3. If a tool is missing when the job gets submitted as finished it will send a warning with all missing tools
	


![[DBDiagram.png]]



### Future Considerations
- Detailed tracking of tool condition




