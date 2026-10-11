#!/usr/bin/env bash
# Raw probes of every NSF Award API endpoint/parameter the client uses.
# Prints status, total count and first award id per request so parameter
# names can be checked against live behaviour (an ignored parameter returns
# the same totals as the unfiltered baseline).
# Usage: scripts/probe-nsf-api.sh [outdir]
set -u
B=https://www.research.gov/awardapi-service/v1
OUT=${1:-live-probe}
mkdir -p "$OUT"
probe() {
  local name=$1 url=$2
  local code
  code=$(curl -sS -m 60 -o "$OUT/$name.json" -w '%{http_code}' "$url")
  local summary
  summary=$(node -e '
    const fs=require("fs");let t=fs.readFileSync(process.argv[1],"utf8");
    try{const d=JSON.parse(t);const r=d.response||{};const a=[].concat(r.award||r.projectOutcomes||[]);
      const m=r.metadata||{};
      console.log(`total=${m.totalCount??"?"} n=${a.length} first=${a[0]?.id??"-"} keys=${Object.keys(a[0]||{}).slice(0,6).join(",")} ${r.serviceNotification?JSON.stringify(r.serviceNotification).slice(0,200):""}`)}
    catch(e){console.log("non-json: "+t.slice(0,200).replace(/\s+/g," "))}' "$OUT/$name.json")
  printf '%-28s %s %s\n' "$name" "$code" "$summary"
}
probe baseline_all              "$B/awards.json?rpp=1"
probe keyword                   "$B/awards.json?keyword=wildfire&rpp=3"
probe keyword_offset1           "$B/awards.json?keyword=wildfire&rpp=2&offset=1"
probe keyword_offset26          "$B/awards.json?keyword=wildfire&rpp=2&offset=26"
probe printFields               "$B/awards.json?keyword=wildfire&rpp=2&printFields=id,title,piLastName,estimatedTotalAmt"
probe awardeeName               "$B/awards.json?awardeeName=University+of+Arizona&rpp=2"
probe awardeeOrganization       "$B/awards.json?awardeeOrganization=University+of+Arizona&rpp=2"
probe awardeeStateCode          "$B/awards.json?awardeeStateCode=NM&rpp=2"
probe piFirst_piLast            "$B/awards.json?piFirstName=Tyson&piLastName=Swetnam&rpp=5"
probe piLastName_only           "$B/awards.json?piLastName=Swetnam&rpp=5"
probe pdPIName                  "$B/awards.json?pdPIName=Swetnam&rpp=5"
probe coPDPI                    "$B/awards.json?coPDPI=Swetnam&rpp=5"
probe startDateFrom_To          "$B/awards.json?keyword=wildfire&startDateFrom=01/01/2020&startDateTo=12/31/2020&rpp=2"
probe startDateStart_End        "$B/awards.json?keyword=wildfire&startDateStart=01/01/2020&startDateEnd=12/31/2020&rpp=2"
probe expDateFrom_To            "$B/awards.json?keyword=wildfire&expDateFrom=01/01/2020&expDateTo=12/31/2020&rpp=2"
probe expDateStart_End          "$B/awards.json?keyword=wildfire&expDateStart=01/01/2020&expDateEnd=12/31/2020&rpp=2"
probe dateStart_End             "$B/awards.json?keyword=wildfire&dateStart=01/01/2020&dateEnd=12/31/2020&rpp=2"
probe awardsDateStart_End       "$B/awards.json?keyword=wildfire&awardsDateStart=01/01/2020&awardsDateEnd=12/31/2020&rpp=2"
probe estTotalAmtFrom_To        "$B/awards.json?keyword=wildfire&estimatedTotalAmtFrom=1000000&estimatedTotalAmtTo=5000000&rpp=2"
probe fundsObligatedAmtFrom_To  "$B/awards.json?keyword=wildfire&fundsObligatedAmtFrom=1000000&fundsObligatedAmtTo=5000000&rpp=2"
probe ueiNumber                 "$B/awards.json?ueiNumber=ED44Y3W6P7B9&rpp=2"
probe agency                    "$B/awards.json?agency=NASA&rpp=2"
probe fundProgramName           "$B/awards.json?fundProgramName=ECOSYSTEM+STUDIES&rpp=2"
probe transType                 "$B/awards.json?transType=Fellowship+Award&rpp=2"
probe perfStateCode             "$B/awards.json?perfStateCode=AZ&rpp=2"
probe award_detail              "$B/awards/1550835.json"
probe award_detail_printFields  "$B/awards/1550835.json?printFields=id,title,abstractText,awardeeName,ueiNumber,publicAccessMandate"
probe award_detail_missing      "$B/awards/0000000.json"
probe outcomes_1550835          "$B/awards/1550835/projectoutcomes.json"
probe outcomes_projectOutcomes  "$B/awards.json?id=1550835&printFields=id,title,projectOutcomesReport"
