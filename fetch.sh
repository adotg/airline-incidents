#!/bin/bash

# Endpoint from where the webpage is fetched
ENDPOINT="https://www.aeroinside.com/incidents/airline/"

while read -r line || [[-n "$line"]]; do
    if [[ $line =~ ^\# ]]; then
        continue
    fi
    
    echo "Fetching for $line"

    curl "$ENDPOINT$line" > "data/$line-raw.html"
done < "airlines.txt"

echo "Completed!!"