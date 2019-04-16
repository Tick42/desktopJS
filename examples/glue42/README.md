desktopJS and [Glue42](https://glue42.com/ "Glue42")
======================================================

Steps to run:
0. Make sure you have ```node``` & ```npm``` installed
1. Download and install the latest [Glue42 Desktop Trial Edition](https://enterprise.glue42.com/install/enterprise/trial/release/GlueInstallerEnterprise.exe?Expires=1555452407&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9lbnRlcnByaXNlLmdsdWU0Mi5jb20vaW5zdGFsbC9lbnRlcnByaXNlL3RyaWFsL3JlbGVhc2UvR2x1ZUluc3RhbGxlckVudGVycHJpc2UuZXhlIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNTU1NDUyNDA3fX19XX0_&Signature=H7iXwEpHoEM3srg45H3T~HFG7-rN73DPhHmEXvzMCHkNVJudsbkrINjzUie~9q6ASRBtxIcg08sEuNgrNLypDW0Y~7uRj8rmFr2fGGZrquB5I2-p1mo3XxDST48cj6TrzfcEsDvEYrQXyDZ9jnC7uy5ehb9CAPJb1hI0~IdrBEJmgv11UluUno~EKdwGRWFDec~BD7azWyfDU2nCJDh2j2mjoouZJ~VzmJqaV33SLeglmDypcxoZ3WAY6T3vCRSkiSOo9Z2GpWIQHe03zwHm0R0AzWbEofwAtw1W5XP7B3AvdTQE5liGATXjzgS6nFFldfLhBY8cEM3erzsHjbzNdQ__&Key-Pair-Id=APKAI7MJZSFJWUJFDJRQ "Download link")
2. Clone https://github.com/Tick42/desktopJS
3.
```bat
cd desktopJS && npm i && npm run bootstrap && npm run build && npm start
```
4. Copy examples/glue42/desktopjs-glue42.json and paste it inside of ```%LOCALAPPDATA%/Tick42/GlueDesktop/config/apps```
5. Start Glue42 Desktop and open the 'desktopJS Glue42' application (it should be on the top of the list)
