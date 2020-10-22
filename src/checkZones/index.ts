import { AzureFunction, Context } from "@azure/functions"
import * as appInsights from "applicationinsights"
import * as dns from "dns"

const appInsightsKey = process.env["APPINSIGHTS_INSTRUMENTATIONKEY"];

if (appInsightsKey) {
    console.log("App Insights key found. Initializing.")
    appInsights.setup(appInsightsKey).start();
}

var telemetry = appInsights.defaultClient;

const checkZones: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    
    var domains = process.env["DNS_ZONES"];

    try {
        var zones = domains.split(",");
    } catch (e) {
        console.error(`No DNS records found. Please create an entry for DNS_ZONES in Application Settings. Separate each DNS zone with a comma.`);(1);
        return;
    }

    zones.forEach(function (zone) {

        const startTime = new Date().getTime();
        
        dns.lookup(zone, (err, address, family) => {

            if (err) {
                console.error(`Error for query: ${zone} | ${err.message}`);
            } else {
                var elapsed = new Date().getTime() - startTime;
                console.log(`Query: ${zone} | Time (ms): ${elapsed} | Address: ${address}`);
    
                let metrics = {};
                metrics['queryTime'] = elapsed;
    
                let props = {}
                props['zoneName'] = zone;
    
                telemetry.trackEvent({name: "dnsZoneQuery", measurements: metrics, properties: props })
            }

          });

    });

};

export default checkZones;
