import React from "react"
import { makeStyles } from "@material-ui/core"
import Image from "../../../components/image/Image"
import ContainerLoader from "../../../components/loader/ContainerLoader"
import Paper from "../../../components/paper/Paper"
import {
	formateNumberDecimalsAuto,
	formateNumberPrice,
	formateNumberPriceDecimals,
	formaterNumber,
} from "../../../helpers/helpers"

import ArrowDropUpIcon from "@material-ui/icons/ArrowDropUp"
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown"

const useStyles = makeStyles((theme) => {
	return {
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
		loaderDetails: {
			height: "100%",
			width: "100%",
			display: "flex",
			flexDirection: "column",
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
		image: {
			width: "30px",
			marginRight: theme.spacing(1),
		},
		token: {
			display: "grid",
			padding: `${theme.spacing(1)}px 0 `,
			gridTemplateColumns: "repeat(auto-fit, minmax(20px, 1fr))",
			rowGap: theme.spacing(2),
			color: theme.palette.gray.contrastText,
			alignItems: "center",
		},
		tokenName: {
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
		},
		titleDetail: {
			fontWeight: "600",
		},
		dataDetail: {
			color: theme.palette.gray.contrastText,
			fontSize: "1.5rem",
		},
		detailsValues: {
			display: "flex",
			flexDirection: "column",
			justifyContent: "space-between",
			paddingTop: "10px",
			width: "100%",
		},
		dataDetailChange: {
			fontSize: "1.2rem",
		},

		colorUp: { color: theme.palette.green.text },
		colorDown: { color: theme.palette.error.main },
		containerUpDown: {
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
		},
	}
})

const PoolInfo = ({ loadingPoolInfo, tokens, pool }) => {
	const classes = useStyles()
	const formatPercent = (value) => {
		return formateNumberDecimalsAuto({ price: value, minDecimal: 0, minPrice: 1, maxDecimal: 2, unit: "%" })
	}
	return (
		<div className={classes.details}>
			<Paper className={classes.detailPaper}>
				<ContainerLoader classChildren={classes.loaderDetails} isLoading={loadingPoolInfo}>
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
											<p>{token.symbolDisplay}</p>
										</div>
										<p className={classes.pooledTokensNumber}>{formaterNumber(token.amount, 0)}</p>
										<p className={classes.pooledTokensNumber}>{formateNumberDecimalsAuto({ price: token.price })}</p>
									</div>
								)
							})}
						</div>
					</div>
					<div className={classes.detail}>
						<p className={classes.titleDetail}>Liquidity</p>
						<div className={classes.detailsValues}>
							<p className={classes.dataDetail}>{formateNumberPrice(pool.liquidity)}</p>
							<p
								className={
									pool.liquidity24hChange === 0
										? classes.dataDetailChange
										: pool.liquidity24hChange > 0
										? `${classes.dataDetailChange} ${classes.colorUp} ${classes.containerUpDown}`
										: `${classes.dataDetailChange} ${classes.colorDown} ${classes.containerUpDown}`
								}
							>
								{pool.liquidity24hChange > 0 ? "↑" : pool.liquidity24hChange < 0 ? "↓" : <span />}
								{formatPercent(Math.abs(pool.liquidity24hChange))}
							</p>
						</div>
					</div>
					<div className={classes.detail}>
						<p className={classes.titleDetail}>Volume (24hrs)</p>
						<div className={classes.detailsValues}>
							<p className={classes.dataDetail}>{formateNumberPrice(pool.volume24h)}</p>
							<p
								className={
									pool.volume24hChange === 0
										? classes.dataDetailChange
										: pool.volume24hChange > 0
										? `${classes.dataDetailChange} ${classes.colorUp} ${classes.containerUpDown}`
										: `${classes.dataDetailChange} ${classes.colorDown} ${classes.containerUpDown}`
								}
							>
								{pool.volume24hChange > 0 ? "↑" : pool.volume24hChange < 0 ? "↓" : <span />}
								{formatPercent(Math.abs(pool.volume24hChange))}
							</p>
						</div>
					</div>

					<div className={classes.detail}>
						<p className={classes.titleDetail}>Volume (7d)</p>
						<p className={classes.dataDetail}>{formateNumberPrice(pool.volume7d)}</p>
					</div>
					<div className={classes.detail}>
						<p className={classes.titleDetail}>Fees</p>
						<p className={classes.dataDetail}>{formatPercent(parseFloat(pool.fees))}</p>
					</div>
				</ContainerLoader>
			</Paper>
		</div>
	)
}

export default React.memo(PoolInfo)
