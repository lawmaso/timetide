paths=(
    "node_modules/@chakra-ui/charts/dist/esm/chart/chart.js"
    "node_modules/@chakra-ui/charts/dist/esm/chart/index.js"
    "node_modules/@chakra-ui/charts/dist/esm/chart/namespace.js"
    "node_modules/@chakra-ui/charts/dist/esm/index.js"
    "node_modules/@chakra-ui/charts/dist/cjs/chart/namespace.cjs"
    "node_modules/@chakra-ui/charts/dist/cjs/chart/index.cjs"
    "node_modules/@chakra-ui/charts/dist/cjs/chart/chart.cjs"
    "node_modules/@chakra-ui/charts/dist/cjs/index.cjs"
)

for path in "${paths[@]}"; do
    if [[ -f "$path" ]]; then
        echo "==== $path ===="
        grep -n "filter\|payload\|value ==\|!value\|isNil\|hideNull|ChartTooltip" ${path}
        echo
    else
        echo "==== $path (not found) ===="
    fi
done
