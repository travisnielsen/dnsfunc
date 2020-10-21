import { AzureFunction, Context } from "@azure/functions"
import * as appInsights from "applicationinsights"
import * as dns from "dns"

const appInsightsKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
const cloudRoleName = process.env.CLOUDROLE_NAME;

if (appInsightsKey) {
    console.log("App Insights key found. Initializing.")
    appInsights.setup(appInsightsKey).start();
    appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = cloudRoleName;
    appInsights.defaultClient.context.tags["ai.cloud.role"] = cloudRoleName;
}

var telemetry = appInsights.defaultClient;


const checkZones: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    
    const domains = process.env.DNS_ZONES;
    const zones = domains.split(",");

    zones.forEach(function (zone) {

        const startTime = new Date().getTime();
        
        dns.lookup(zone, (err, address, family) => {

            var elapsed = new Date().getTime() - startTime;
            console.log(zone, elapsed);
            console.log('address: %j family: IPv%s', address, family);

            let metrics = {};
            metrics['queryTime'] = elapsed;

            let props = {}
            props['zoneName'] = zone;

            telemetry.trackEvent({name: "dnsZoneQuery", measurements: metrics, properties: props })

          });

    });

    // context.log('Timer trigger function ran!', timeStamp);   
};

export default checkZones;
