import { makeStyles } from "@material-ui/core"
import { useCallback, useState, useRef } from "react"
import { useEffect } from "react"
import { useHistory, useParams } from "react-router-dom"
import ButtonGroup from "../../../components/buttonGroup/ButtonGroup"
import Image from "../../../components/image/Image"
import ContainerLoader from "../../../components/loader/ContainerLoader"
import Paper from "../../../components/paper/Paper"
import { usePools } from "../../../contexts/PoolsProvider"
import {
	formatDate,
	formatDateHours,
	formateNumberDecimals,
	formateNumberPrice,
	formateNumberPriceDecimals,
	detectBestDecimalsDisplay,
	formaterNumber,
	getInclude,
	twoNumber,
	getDates,
} from "../../../helpers/helpers"
import PoolChart from "./PoolChart"
import PoolLiquidityChart from "./PoolLiquidityChart"
import PoolPath from "./PoolPath"
import PoolSelect from "./PoolSelect"
import PoolTitle from "./PoolTitle"
import PoolVolumeChart from "./PoolVolumeChart"
import { CSSTransitionGroup } from "react-transition-group"

const useStyles = makeStyles((theme) => {
	return {
		poolRoot: {
			display: "grid",
			gridAutoRows: "auto",
			rowGap: theme.spacing(2),
		},
		containerInfo: {
			display: "grid",
			gridAutoRows: "auto",
			rowGap: theme.spacing(2),
			minHeight: "180px",
		},
		charts: {
			display: "grid",
			gridTemplateColumns: "300px 1fr",
			gap: theme.spacing(1),

			[theme.breakpoints.down("xs")]: {
				gridTemplateColumns: "1fr",
				gridTemplateRows: "1fr 1fr",
			},
		},
		details: {
			display: "flex",
			flexDirection: "column",
			[theme.breakpoints.down("xs")]: {
				width: "100%",
			},
		},
		detail: {
			padding: theme.spacing(2),
		},
		textBig: {
			fontSize: theme.fontSize.big,
			color: theme.palette.gray.contrastText,
			fontVariantNumeric: "tabular-nums",
		},
		detailPaper: {},
		dataDetail: {
			fontSize: theme.fontSize.big,
			color: theme.palette.gray.contrastText,
		},
		titleDetail: {
			fontWeight: "600",
		},
		right: {
			zIndex: "0",
			height: "100%",
			[theme.breakpoints.down("xs")]: {
				width: "100%",
			},
		},
		chart: {
			width: "100%",
			height: "80%",
		},
		groupButtons: {
			display: "flex",
			alignItems: "flex-end",
			flexDirection: "column",
			justifyContent: "flex-end",
			padding: theme.spacing(1),
		},
		groupButton: {
			marginBottom: theme.spacing(1),
		},
		token: {
			display: "grid",
			padding: `${theme.spacing(1)}px 0 `,
			gridTemplateColumns: "repeat(auto-fit, minmax(20px, 1fr))",
			rowGap: theme.spacing(2),
			color: theme.palette.gray.contrastText,
			alignItems: "center",
		},
		image: {
			width: "30px",
			marginRight: theme.spacing(1),
		},
		tokenName: {
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
		},
		poolName: {
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
		},
		convertContainer: {
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
			width: "fit-content",
			padding: "6px 10px",
		},
		pooledTokens: {
			backgroundColor: theme.palette.primary.dark2,
			fontSize: theme.fontSize.small,
			padding: theme.spacing(2),
			borderRadius: theme.spacing(2),
		},
		pooledTokensTitle: {
			fontWeight: "600",
		},
		pooledTokensImages: {
			width: "25px",
		},
		pooledTokensNumber: {
			textAlign: "right",
		},
		chartHeader: {
			display: "flex",
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
		},
		chartData: {},
		containerErrorChart: {
			height: "100%",
			width: "100%",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		},
		errorChart: {
			margin: "auto",
		},
	}
})

const Pool = ({ showToast }) => {
	const classes = useStyles()
	const history = useHistory()
	const { id } = useParams()
	const { getPoolData, getChartPool, pools, getVolumeChartPool, getLiquidityChartPool } = usePools()

	//save data here to avoid to re fetching data if is already fetched
	const [pool, setPool] = useState({})
	const [tokens, setTokens] = useState([])
	const [pairs, setPairs] = useState({})
	const [convertData, setConvertData] = useState(0)

	const [currentPair, setCurrentPair] = useState([]) // Data of the current pair
	const [fees, setFees] = useState("0.0%") // Data of fees

	const [selectRange, setSelectRange] = useState("7d")
	const [liquidity, setLiquidity] = useState([])
	const [volume, setVolume] = useState([])
	const [selectTypeChart, setSelectTypeChart] = useState("price")
	const [selectedTokens, setSelectedTokens] = useState({ one: {}, two: {} })
	const [price, setPrice] = useState({ price: "0", date: "-" })
	const pairDecimals = useRef(3)
	const pricesDecimals = useRef([2, 2])

	const [rangeVolume, setRangeVolume] = useState("d")

	/* Loaders */
	const [loadingRateChart, setLoadingRateChart] = useState(true) // rate data is not loaded
	const [loadingPoolDetails, setLoadingPoolDetails] = useState(true) // rate data is not loaded
	const [loadingPoolInfo, setLoadingPoolInfo] = useState(true) // rate data is not loaded

	const dataClickVolume = useRef({ time: { day: 1, month: 1, year: 1 }, value: 0, clickedTwice: true })
	const volumeRef = useRef([])

	useEffect(() => {
		// get pool from history state
		if (!id) {
			showToast({
				severity: "warning",
				text: "Pool not find, you are redirected to pools page.",
			})
			history.push("/pools")
		} else {
			if (pools.length > 0) {
				let indexPool = getInclude(pools, (pool) => pool.id === id)
				if (indexPool >= 0) {
					setPool({ ...pools[indexPool] })
				} else {
					showToast({
						severity: "warning",
						text: "Pool not find, you are redirected to pools page.",
					})
					history.push("/pools")
				}
			}
		}
	}, [id, showToast, history, pools])

	useEffect(() => {
		// fetch pool details from server
		const fetch = async () => {
			let tokensPool = await getPoolData(pool.id)
			setFees(tokensPool[0].fees)
			setTokens([...tokensPool])
		}
		if (pool.id) {
			fetch()
		}
	}, [pool, getPoolData])

	useEffect(() => {
		// fetch the first pair details from server
		const fetch = async () => {
			// range possible: 7d, 1mo, 1y, all
			setLoadingRateChart(true)
			setLoadingPoolDetails(true)
			setLoadingPoolInfo(true)
			try {
				let firstPair = await getChartPool({
					poolId: pool.id,
					denomIn: tokens[0].denom,
					denomOut: tokens[1].denom,
					range: "7d",
				})
				if (typeof firstPair === "string") {
					throw new Error(firstPair)
				}
				// Update pair token decimal
				pairDecimals.current =
					firstPair.length > 0 ? detectBestDecimalsDisplay(firstPair[firstPair.length - 1].open) : 3
				// Update both token price decimals
				let tmpPricesDecimals = [2, 2]
				for (let i = 0; i < tokens.length; i++) {
					tmpPricesDecimals[i] = detectBestDecimalsDisplay(tokens[i].price)
				}
				pricesDecimals.current = tmpPricesDecimals
				setPairs((ps) => {
					let namePair = getPairName({
						one: tokens[0],
						two: tokens[1],
						range: "7d",
					})
					return { ...ps, [namePair]: firstPair }
				})
				setCurrentPair(firstPair)
				updateCoinPrice(firstPair)
				setPrice({
					price: formateNumberDecimals(firstPair[firstPair.length - 1].close, pairDecimals.current),
					date: formatDateHours(new Date()),
				})
				let volume = await getVolumeChartPool({ poolId: pool.id })
				setVolume(volume)
				volumeRef.current = volume
				setLiquidity(await getLiquidityChartPool({ poolId: pool.id }))
				setLoadingRateChart(false)
				setLoadingPoolDetails(false)
				setLoadingPoolInfo(false)
			} catch (error) {
				console.log("Pool.jsx -> 207: error", error)
				setLoadingRateChart(false)
				setLoadingPoolDetails(false)
				setLoadingPoolInfo(false)
			}
			setSelectedTokens({ one: tokens[0], two: tokens[1] })
		}
		if (pool.id && tokens.length > 1) {
			fetch()
		}
	}, [tokens, pool, getChartPool, getVolumeChartPool, getLiquidityChartPool])

	const getPairName = ({ one, two, range }) => {
		// used to get the name of the pair (name of Map of pairs)
		return `${one.denom}-${two.denom}-${range}`
	}

	const updateTokenData = async (one, two, range) => {
		let namePair = getPairName({ one, two, range })
		let pair = []
		if (pairs[namePair]) {
			// check if data is already fetched
			pair = pairs[namePair]
		} else {
			// need to fetch data
			pair = await getChartPool({
				poolId: pool.id,
				denomIn: one.denom,
				denomOut: two.denom,
				range,
			})
			if (typeof pair === "object" && pair.length > 0) {
				setPairs((ps) => {
					return { ...ps, [namePair]: pair }
				})
			} else {
				pair = []
			}
		}
		if (pair.length > 0) {
			pairDecimals.current = detectBestDecimalsDisplay(pair[pair.length - 1].open)
			setPrice({
				price: formateNumberDecimals(pair[pair.length - 1].open, pairDecimals.current),
				date: formatDateHours(new Date()),
			})

			setCurrentPair(pair)
			updateCoinPrice(pair)
		}
	}

	const onChangeRange = (value) => {
		setSelectRange(value)
		updateTokenData(selectedTokens.one, selectedTokens.two, value)
		volumeRef.current = volume
	}

	const onChangeRangeVolume = async (value) => {
		setRangeVolume(value)
		let volume = await getVolumeChartPool({ poolId: pool.id, range: value })
		setVolume(volume)
		volumeRef.current = volume
		updateVolumeInfo(volume[volume.length - 1], value)
	}

	const onChangeTypeChart = (value) => {
		setSelectTypeChart(value)
		if (value === "price") {
			updateTokenData(selectedTokens.one, selectedTokens.two, selectRange)
		} else if (value === "volume" && volume.length > 0) {
			let lastElt = volume[volume.length - 1]
			let date = ""
			if (lastElt.time.year) {
				date = new Date(lastElt.time.year + "-" + twoNumber(lastElt.time.month) + "-" + twoNumber(lastElt.time.day))
			} else {
				date = new Date(lastElt.time)
			}
			updateVolumeInfo({ time: date, value: lastElt.value }, rangeVolume)
		} else if (value === "liquidity" && liquidity.length > 0) {
			let price = "$" + formaterNumber(liquidity[liquidity.length - 1].value, 2)
			let date = ""
			if (typeof liquidity[liquidity.length - 1].time === "string") {
				date = new Date(liquidity[liquidity.length - 1].time)
			} else {
				date = new Date(
					`${twoNumber(liquidity[liquidity.length - 1].time.year)}/${twoNumber(
						liquidity[liquidity.length - 1].time.month
					)}/${twoNumber(liquidity[liquidity.length - 1].time.day)}`
				)
			}
			setPrice({ price, date: formatDate(date) })
		}
	}

	const updateCoinPrice = (pair) => {
		let lastElt = pair[pair.length - 1]
		setConvertData(formateNumberDecimals(lastElt.close, 4))
	}

	const onChangeSeletedToken = (selectedTokens) => {
		setSelectedTokens(selectedTokens)
		updateTokenData(selectedTokens.one, selectedTokens.two, selectRange)
	}

	const crossMove = useCallback(
		(event, serie) => {
			if (selectTypeChart === "price") {
				if (event.time) {
					let price = formateNumberDecimals(event.seriesPrices.get(serie).close, pairDecimals.current)

					let currentDate = new Date(event.time * 1000)
					setPrice({ price, date: formatDateHours(currentDate) })
				}
			} else if (selectTypeChart === "volume") {
				if (event.time) {
					updateVolumeInfo(
						{
							time: new Date(`${event.time.year}-${event.time.month}-${event.time.day}`),
							value: event.seriesPrices.get(serie),
						},
						rangeVolume
					)
				}
			} else {
				if (event.time) {
					let price = "$" + formaterNumber(event.seriesPrices.get(serie), 2)
					let date = new Date(
						`${twoNumber(event.time.year)}/${twoNumber(event.time.month)}/${twoNumber(event.time.day)}`
					)
					setPrice({ price, date: formatDate(date) })
				}
			}
		},
		[selectTypeChart, rangeVolume]
	)

	const updateVolumeInfo = (item, range) => {
		if (item && item.time) {
			let date = new Date(item.time)
			let price = "$" + formaterNumber(item.value, 2)
			let dateStr = formatDate(date)
			if (range && range != "d") {
				let dates = getDates(date, range)
				dateStr = `${formatDate(dates[0])} - ${formatDate(dates[1])}`
			}
			setPrice({ price, date: dateStr })
		}
	}

	const onMouseLeaveVolume = (e) => {
		let value = volume[volume.length - 1]
		if (dataClickVolume.current.clickedTwice) {
			if (value.time) {
				updateVolumeInfo(
					{
						time: new Date(`${value.time.year}-${value.time.month}-${value.time.day}`),
						value: value.value,
					},
					rangeVolume
				)
			}
		} else {
			if (dataClickVolume.current.time) {
				updateVolumeInfo(
					{
						time: new Date(
							`${dataClickVolume.current.time.year}-${dataClickVolume.current.time.month}-${dataClickVolume.current.time.day}`
						),
						value: dataClickVolume.current.value,
					},
					rangeVolume
				)
			}
		}
	}

	const onMouseLeaveLiquidity = (e) => {
		let value = liquidity[liquidity.length - 1]
		if (value.time) {
			let price = "$" + formaterNumber(value.value, 2)
			setPrice({ price, date: formatDate(new Date(`${value.time.year}-${value.time.month}-${value.time.day}`)) })
		}
	}

	const onMouseLeavePrice = (e) => {
		let value = currentPair[currentPair.length - 1]
		if (value.time) {
			let price = formateNumberDecimals(value.close, pairDecimals.current)

			let currentDate = new Date(value.time * 1000)
			setPrice({ price, date: formatDateHours(currentDate) })
		}
	}

	const onClickChartVolume = (e) => {
		let index = getInclude(volumeRef.current, (item) => {
			return item.time.year === e.time.year && item.time.month === e.time.month && item.time.day === e.time.day
		})
		if (index > -1) {
			let same =
				e.time.year === dataClickVolume.current.time.year &&
				e.time.month === dataClickVolume.current.time.month &&
				e.time.day === dataClickVolume.current.time.day
			dataClickVolume.current = {
				time: volumeRef.current[index].time,
				value: volumeRef.current[index].value,
				clickedTwice: same ? !dataClickVolume.current.clickedTwice : false,
			}
		}
	}

	let chartRender = (
		<div className={classes.containerErrorChart} key="noChart">
			<p className={classes.errorChart}>Not enough liquidity to display chart price.</p>
		</div>
	)

	if (selectTypeChart === "price" && currentPair.length > 0) {
		chartRender = (
			<PoolChart
				onMouseLeave={onMouseLeavePrice}
				key={"PoolChartPrice" + selectRange}
				data={currentPair}
				crossMove={crossMove}
			/>
		)
	} else if (selectTypeChart === "volume" && volume.length > 0) {
		chartRender = (
			<PoolVolumeChart
				onClick={onClickChartVolume}
				onMouseLeave={onMouseLeaveVolume}
				key={"PoolChartVolume" + selectRange}
				data={volume}
				crossMove={crossMove}
			/>
		)
	} else if (selectTypeChart === "liquidity" && liquidity.length > 0) {
		chartRender = (
			<PoolLiquidityChart
				onMouseLeave={onMouseLeaveLiquidity}
				key={"PoolChartLiquidity" + selectRange}
				data={liquidity}
				crossMove={crossMove}
			/>
		)
	}

	return (
		<div className={classes.poolRoot}>
			<ContainerLoader className={classes.containerInfo} isLoading={loadingPoolDetails}>
				<PoolPath pool={pool} />
				<PoolTitle pool={pool} tokens={tokens} />

				<Paper className={classes.convertContainer}>
					<Image
						className={`${classes.image}`}
						assets={true}
						alt={`${selectedTokens.two.symbol}`}
						src={`https://raw.githubusercontent.com/osmosis-labs/assetlists/main/images/${selectedTokens.two?.symbol?.toLowerCase()}.png`}
						srcFallback="../assets/default.png"
						pathAssets=""
					/>
					<p>
						1 {selectedTokens.two.symbol} = {convertData} {selectedTokens.one.symbol}{" "}
					</p>
				</Paper>
				<PoolSelect tokens={tokens} setSelectedTokens={onChangeSeletedToken} selectedTokens={selectedTokens} />
			</ContainerLoader>
			<div className={classes.charts}>
				<ContainerLoader isLoading={loadingPoolInfo}>
					<div className={classes.details}>
						<Paper className={classes.detailPaper}>
							<div className={classes.pooledTokens}>
								<p className={classes.pooledTokensTitle}>Pooled tokens</p>
								<div className={classes.tokensContainer}>
									{tokens.map((token, i) => {
										return (
											<div className={classes.token} key={token.denom}>
												<div className={classes.tokenName}>
													<Image
														className={`${classes.image} ${classes.pooledTokensImages}`}
														assets={true}
														alt={`${token.symbol}`}
														src={`https://raw.githubusercontent.com/osmosis-labs/assetlists/main/images/${token.symbol.toLowerCase()}.png`}
														srcFallback="../assets/default.png"
														pathAssets=""
													/>
													<p>{token.symbol}</p>
												</div>
												<p className={classes.pooledTokensNumber}>{formaterNumber(token.amount, 0)}</p>
												<p className={classes.pooledTokensNumber}>
													{formateNumberPriceDecimals(token.price, pricesDecimals.current[i])}
												</p>
											</div>
										)
									})}
								</div>
							</div>
							<div className={classes.detail}>
								<p className={classes.titleDetail}>Liquidity</p>
								<p variant="body2" className={classes.dataDetail}>
									{formateNumberPrice(pool.liquidity)}
								</p>
							</div>
							<div className={classes.detail}>
								<p className={classes.titleDetail}>Volume (24hrs)</p>
								<p variant="body2" className={classes.dataDetail}>
									{formateNumberPrice(pool.volume_24h)}
								</p>
							</div>
							<div className={classes.detail}>
								<p className={classes.titleDetail}>Volume (7d)</p>
								<p variant="body2" className={classes.dataDetail}>
									{formateNumberPrice(pool.volume_7d)}
								</p>
							</div>
							<div className={classes.detail}>
								<p className={classes.titleDetail}>Fees</p>
								<p variant="body2" className={classes.dataDetail}>
									{fees}
								</p>
							</div>
						</Paper>
					</div>
				</ContainerLoader>
				<ContainerLoader className={classes.right} isLoading={loadingPoolInfo}>
					<Paper className={classes.right}>
						<div className={classes.chartHeader}>
							<div className={classes.chartData}>
								<p className={classes.textBig}>
									{price.price} {selectTypeChart === "price" ? selectedTokens.one.symbol : ""}
								</p>
								<p>{price.date}</p>
							</div>
							<div className={classes.groupButtons}>
								<ButtonGroup
									className={classes.groupButton}
									buttons={[
										{
											id: "price",
											name: "Rate",
											onClick: () => {
												onChangeTypeChart("price")
											},
										},
										{
											id: "liquidity",
											name: "Liquidity",
											onClick: () => {
												onChangeTypeChart("liquidity")
											},
										},
										{
											id: "volume",
											name: "Volume",
											onClick: () => {
												onChangeTypeChart("volume")
											},
										},
									]}
									active={selectTypeChart}
								/>
								<ButtonGroup
									style={selectTypeChart !== "price" ? { display: "none" } : {}}
									buttons={[
										{
											id: "7d",
											name: "7d",
											onClick: () => {
												onChangeRange("7d")
											},
										},
										{
											id: "1mo",
											name: "1m",
											onClick: () => {
												onChangeRange("1mo")
											},
										},
										{
											id: "1y",
											name: "1y",
											onClick: () => {
												onChangeRange("1y")
											},
										},
										{
											id: "all",
											name: "all",
											onClick: () => {
												onChangeRange("all")
											},
										},
									]}
									active={selectRange}
								/>
								<ButtonGroup
									style={selectTypeChart !== "volume" ? { display: "none" } : {}}
									buttons={[
										{
											id: "d",
											name: "d",
											onClick: () => {
												onChangeRangeVolume("d")
											},
										},
										{
											id: "w",
											name: "w",
											onClick: () => {
												onChangeRangeVolume("w")
											},
										},
										{
											id: "m",
											name: "m",
											onClick: () => {
												onChangeRangeVolume("m")
											},
										},
									]}
									active={rangeVolume}
								/>
							</div>
						</div>
						<div className={classes.chart}>
							<CSSTransitionGroup transitionName="fade" transitionEnterTimeout={300} transitionLeaveTimeout={300}>
								{chartRender}
							</CSSTransitionGroup>
						</div>
					</Paper>
				</ContainerLoader>
			</div>
		</div>
	)
}

export default Pool
